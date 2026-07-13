import { DurableObject } from 'cloudflare:workers'
import { Chess } from 'chess.js'
import {
  MAX_CHAT_HISTORY,
  MAX_CHAT_LENGTH,
  type ChatMessage,
  type ClientMessage,
  type Color,
  type CreateGameRequest,
  type GameState,
  type Mode,
  type Result,
  type Seat,
  type ServerMessage,
  type TimeControl,
} from '../shared/protocol'
import type { Env } from './index'

/** Everything about one game. One Durable Object holds exactly one of these. */
interface Game {
  code: string
  mode: Mode
  time: TimeControl
  /** Position after each half-move; `fens[0]` is the starting position. */
  fens: string[]
  moves: string[]
  status: GameState['status']
  result: Result | null
  whiteMs: number
  blackMs: number
  /** Server time the running side's clock was last charged, or null if stopped. */
  since: number | null
  running: Color | null
  /** Seat tokens. Presence of a token means the seat is claimed. */
  tokens: Partial<Record<Color, string>>
  drawOfferFrom: Color | null
  takebackOfferFrom: Color | null
  chat: ChatMessage[]
  chatSeq: number
  /** When this room deletes itself if nothing further happens. */
  expiresAt: number
}

const START_FEN = new Chess().fen()

/**
 * A game nobody joins, or nobody finishes, would otherwise sit in storage
 * forever — invisible, unbounded, and billable. Every room carries a deadline
 * that each action pushes forward, and the room deletes itself when it passes.
 */
const TTL_MS: Record<GameState['status'], number> = {
  waiting: 60 * 60_000, // an invitation nobody took up
  active: 24 * 60 * 60_000, // a real game, possibly played over a day
  over: 30 * 60_000, // long enough to read the result and talk about it
}

/** Cap on connections to one room, so a code cannot become a broadcast relay. */
const MAX_SOCKETS = 30
/** No legitimate client message is anywhere near this big. */
const MAX_FRAME_BYTES = 4096

/**
 * Per-socket flood budget: a bucket of `BUCKET_SIZE` messages that refills at
 * `REFILL_PER_SEC`. Ordinary play never approaches it; a script hits it at once.
 */
const BUCKET_SIZE = 25
const REFILL_PER_SEC = 2
const CHAT_COST = 3

interface Bucket {
  tokens: number
  at: number
}

interface Attachment {
  seat: Seat
  token: string
  bucket: Bucket
}

export class GameRoom extends DurableObject<Env> {
  private game: Game | null = null

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    ctx.blockConcurrencyWhile(async () => {
      this.game = (await ctx.storage.get<Game>('game')) ?? null
    })
  }

  /**
   * Called once by the Worker when the host creates the game. Returns the
   * host's seat token. A second call on a live code is a collision and is
   * refused, so the Worker can retry with a fresh code.
   */
  async create(
    code: string,
    request: CreateGameRequest,
    hostColor: Color,
  ): Promise<string | null> {
    if (this.game) return null

    // A shared analysis board has no turn order, so a clock would be meaningless.
    const time = request.mode === 'freeplay'
      ? { initialMs: 0, incrementMs: 0 }
      : request.time

    const token = crypto.randomUUID()
    this.game = {
      code,
      mode: request.mode,
      time,
      fens: [START_FEN],
      moves: [],
      status: 'waiting',
      result: null,
      whiteMs: time.initialMs,
      blackMs: time.initialMs,
      since: null,
      running: null,
      tokens: { [hostColor]: token },
      drawOfferFrom: null,
      takebackOfferFrom: null,
      chat: [],
      chatSeq: 0,
      expiresAt: Date.now() + TTL_MS.waiting,
    }
    await this.save()
    await this.scheduleAlarm()
    return token
  }

  async exists(): Promise<boolean> {
    return this.game !== null
  }

  async fetch(_request: Request): Promise<Response> {
    if (!this.game) return new Response('No such game', { status: 404 })
    if (this.ctx.getWebSockets().length >= MAX_SOCKETS) {
      return new Response('This game already has too many viewers.', { status: 503 })
    }

    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair)
    // Hibernation: the room can be evicted between moves without dropping
    // anyone, which is what makes a long correspondence-paced game free.
    this.ctx.acceptWebSocket(server)
    return new Response(null, { status: 101, webSocket: client })
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer) {
    if (typeof raw !== 'string') return
    if (raw.length > MAX_FRAME_BYTES) {
      return ws.close(1009, 'Message too large.')
    }

    let message: ClientMessage
    try {
      message = JSON.parse(raw)
    } catch {
      return this.send(ws, { t: 'error', message: 'Malformed message.' })
    }

    const game = this.game
    if (!game) return this.send(ws, { t: 'error', message: 'This game is gone.' })

    if (message.t === 'join') return this.onJoin(ws, game, message.token)

    const attached = ws.deserializeAttachment() as Attachment | null
    if (!attached) {
      return this.send(ws, { t: 'error', message: 'Join the game first.' })
    }

    if (!this.spend(ws, attached, message.t === 'chat' ? CHAT_COST : 1)) {
      return this.send(ws, { t: 'error', message: 'Slow down.' })
    }

    try {
      switch (message.t) {
        case 'chat':
          this.onChat(game, attached.seat, message.text)
          break
        case 'move':
          this.onMove(game, this.requirePlayer(attached.seat), message)
          break
        case 'resign':
          this.onResign(game, this.requirePlayer(attached.seat))
          break
        case 'offer':
          this.onOffer(game, this.requirePlayer(attached.seat), message.kind)
          break
        case 'respond':
          this.onRespond(
            game,
            this.requirePlayer(attached.seat),
            message.kind,
            message.accept,
          )
          break
        default:
          return
      }
    } catch (error) {
      return this.send(ws, {
        t: 'error',
        message: error instanceof Error ? error.message : 'Something went wrong.',
      })
    }

    this.touch(game)
    await this.save()
    await this.scheduleAlarm()
    this.broadcast()
  }

  async webSocketClose(ws: WebSocket) {
    // The seat stays claimed — the token is what owns it, not the socket, so a
    // refresh or a tunnel drop comes back to the same game.
    ws.close()
    this.broadcast()
  }

  async webSocketError(ws: WebSocket) {
    void ws
    this.broadcast()
  }

  /**
   * A Durable Object gets exactly one alarm, and two things need one: the
   * clock running out, and the room outliving its usefulness. So the alarm is
   * set for whichever comes first, and this decides which actually happened.
   */
  async alarm(): Promise<void> {
    const game = this.game
    if (!game) return

    if (Date.now() >= game.expiresAt) return this.destroy()

    const flagged =
      game.status === 'active' &&
      game.running &&
      game.since !== null &&
      this.remainingMs(game, game.running) <= 0
        ? game.running
        : null

    if (!flagged) return this.scheduleAlarm()

    this.charge(game)
    this.end(game, {
      winner: flagged === 'white' ? 'black' : 'white',
      reason: 'timeout',
    })
    this.systemChat(game, `${label(flagged)} ran out of time.`)
    this.touch(game)
    await this.save()
    await this.scheduleAlarm()
    this.broadcast()
  }

  /** The room's whole life ends here: storage freed, everyone disconnected. */
  private async destroy(): Promise<void> {
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.close(1000, 'This game has expired.')
      } catch {
        // Already gone.
      }
    }
    this.game = null
    // Also clears the alarm.
    await this.ctx.storage.deleteAll()
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  private async onJoin(ws: WebSocket, game: Game, token?: string) {
    let seat: Seat = 'spectator'
    let seatToken = token ?? ''

    const claimed = (['white', 'black'] as Color[]).find(
      (color) => token && game.tokens[color] === token,
    )

    if (claimed) {
      // Reclaiming a seat after a refresh or a disconnect.
      seat = claimed
    } else {
      const free = (['white', 'black'] as Color[]).find((color) => !game.tokens[color])
      if (free) {
        seatToken = crypto.randomUUID()
        game.tokens[free] = seatToken
        seat = free
      }
    }

    // One connection per seat: a second tab claiming the same token takes over,
    // so the token can never end up driving two boards at once.
    if (seat !== 'spectator') {
      for (const other of this.ctx.getWebSockets()) {
        if (other === ws) continue
        const attachment = other.deserializeAttachment() as Attachment | null
        if (attachment?.seat === seat) other.close(1000, 'Seat taken over by a newer tab.')
      }
    }

    ws.serializeAttachment({
      seat,
      token: seatToken,
      bucket: { tokens: BUCKET_SIZE, at: Date.now() },
    } satisfies Attachment)

    // Both seats filled — the game (and the clock) begins.
    if (game.status === 'waiting' && game.tokens.white && game.tokens.black) {
      game.status = 'active'
      if (game.time.initialMs > 0 && game.mode === 'referee') {
        game.running = 'white'
        game.since = Date.now()
      }
      this.systemChat(game, 'Both players are here. Good game!')
    }

    this.touch(game)
    await this.save()
    await this.scheduleAlarm()
    this.send(ws, {
      t: 'welcome',
      you: seat,
      token: seatToken,
      state: this.publicState(game),
      now: Date.now(),
    })
    this.broadcast()
  }

  private onMove(
    game: Game,
    seat: Color,
    move: { from: string; to: string; promotion?: string },
  ) {
    if (game.status === 'over') throw new Error('This game is already over.')
    if (game.status === 'waiting') throw new Error('Waiting for an opponent.')

    const chess = this.position(game)

    if (game.mode === 'referee') {
      if (this.turn(game) !== seat) throw new Error('Not your turn.')
    } else {
      // Freeplay: either player may move either colour, so if the piece being
      // moved is not the side to move, hand the turn to it first. The move
      // itself still has to be legal — that is the whole of the refereeing.
      const piece = chess.get(move.from as never)
      if (!piece) throw new Error('No piece there.')
      if (piece.color !== chess.turn()) {
        chess.load(flipTurn(chess.fen()), { skipValidation: true })
      }
    }

    let played
    try {
      played = chess.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion ?? 'q',
      })
    } catch {
      throw new Error('Illegal move.')
    }
    if (!played) throw new Error('Illegal move.')

    if (game.mode === 'referee' && game.running) {
      // Charge the mover for the time they took, then add their increment.
      this.charge(game)
      const key = seat === 'white' ? 'whiteMs' : 'blackMs'
      game[key] += game.time.incrementMs
    }

    game.moves.push(played.san)
    game.fens.push(chess.fen())
    // Any move supersedes a pending offer.
    game.drawOfferFrom = null
    game.takebackOfferFrom = null

    const result = this.adjudicate(game, chess)
    if (result) {
      this.end(game, result)
      this.systemChat(game, describeResult(result))
      return
    }

    if (game.mode === 'referee' && game.time.initialMs > 0) {
      game.running = this.turn(game)
      game.since = Date.now()
    }
  }

  /**
   * In referee mode the server calls the game. In freeplay, checkmate is the
   * only thing it will declare — everything else is for the players to argue
   * about, which is the point of an analysis board.
   */
  private adjudicate(game: Game, chess: Chess): Result | null {
    if (chess.isCheckmate()) {
      return { winner: chess.turn() === 'w' ? 'black' : 'white', reason: 'checkmate' }
    }
    if (game.mode === 'freeplay') return null
    if (chess.isStalemate()) return { winner: null, reason: 'stalemate' }
    if (chess.isInsufficientMaterial()) {
      return { winner: null, reason: 'insufficient-material' }
    }
    if (chess.isThreefoldRepetition()) {
      return { winner: null, reason: 'threefold-repetition' }
    }
    if (chess.isDraw()) return { winner: null, reason: 'fifty-move-rule' }
    return null
  }

  private onResign(game: Game, seat: Color) {
    if (game.status !== 'active') throw new Error('No game in progress.')
    this.charge(game)
    this.end(game, {
      winner: seat === 'white' ? 'black' : 'white',
      reason: 'resignation',
    })
    this.systemChat(game, `${label(seat)} resigned.`)
  }

  private onOffer(game: Game, seat: Color, kind: 'draw' | 'takeback') {
    if (game.status !== 'active') throw new Error('No game in progress.')
    if (kind === 'draw') {
      game.drawOfferFrom = seat
      this.systemChat(game, `${label(seat)} offers a draw.`)
      return
    }
    if (game.moves.length === 0) throw new Error('There is nothing to take back.')

    // On a shared analysis board a takeback needs nobody's permission — taking
    // moves back is the whole point of the mode.
    if (game.mode === 'freeplay') {
      this.takeBack(game, seat)
      return
    }

    game.takebackOfferFrom = seat
    this.systemChat(game, `${label(seat)} asks to take back a move.`)
  }

  private onRespond(
    game: Game,
    seat: Color,
    kind: 'draw' | 'takeback',
    accept: boolean,
  ) {
    const offeredBy = kind === 'draw' ? game.drawOfferFrom : game.takebackOfferFrom
    if (!offeredBy) throw new Error('There is no offer to answer.')
    if (offeredBy === seat) throw new Error('You cannot answer your own offer.')

    if (kind === 'draw') {
      game.drawOfferFrom = null
      if (!accept) return this.systemChat(game, `${label(seat)} declined the draw.`)
      this.charge(game)
      this.end(game, { winner: null, reason: 'draw-agreed' })
      this.systemChat(game, 'Draw agreed.')
      return
    }

    game.takebackOfferFrom = null
    if (!accept) return this.systemChat(game, `${label(seat)} declined the takeback.`)
    this.takeBack(game, offeredBy)
    this.systemChat(game, `Takeback: it is ${label(this.turn(game))}'s move again.`)
  }

  /** Undo half-moves until it is `requester`'s turn again (one ply, or two). */
  private takeBack(game: Game, requester: Color) {
    this.charge(game)
    for (let i = 0; i < 2 && game.moves.length > 0; i++) {
      game.moves.pop()
      game.fens.pop()
      if (game.mode === 'freeplay' || this.turn(game) === requester) break
    }
    if (game.mode === 'referee' && game.time.initialMs > 0 && game.status === 'active') {
      game.running = this.turn(game)
      game.since = Date.now()
    }
  }

  private onChat(game: Game, seat: Seat, text: string) {
    const clean = text.trim().slice(0, MAX_CHAT_LENGTH)
    if (!clean) return
    game.chat.push({
      id: ++game.chatSeq,
      from: seat,
      text: clean,
      at: Date.now(),
    })
    if (game.chat.length > MAX_CHAT_HISTORY) game.chat.shift()
  }

  private systemChat(game: Game, text: string) {
    game.chat.push({ id: ++game.chatSeq, from: 'system', text, at: Date.now() })
    if (game.chat.length > MAX_CHAT_HISTORY) game.chat.shift()
  }

  // ── Clock ──────────────────────────────────────────────────────────────────

  private remainingMs(game: Game, color: Color): number {
    const base = color === 'white' ? game.whiteMs : game.blackMs
    if (game.running !== color || game.since === null) return base
    return Math.max(0, base - (Date.now() - game.since))
  }

  /** Bank the time the running side has used so far and stop their clock. */
  private charge(game: Game) {
    if (!game.running || game.since === null) return
    const key = game.running === 'white' ? 'whiteMs' : 'blackMs'
    game[key] = this.remainingMs(game, game.running)
    game.running = null
    game.since = null
  }

  /**
   * Wake the room at the earlier of: the side to move flagging, and the room
   * expiring. Nothing wakes it in between, so an idle game costs nothing.
   */
  private async scheduleAlarm() {
    const game = this.game
    if (!game) return this.ctx.storage.deleteAlarm()

    let wakeAt = game.expiresAt
    if (game.status === 'active' && game.running && game.since !== null) {
      wakeAt = Math.min(wakeAt, Date.now() + this.remainingMs(game, game.running))
    }
    await this.ctx.storage.setAlarm(wakeAt)
  }

  /** Push the room's deadline out; anything a player does counts as life. */
  private touch(game: Game) {
    game.expiresAt = Date.now() + TTL_MS[game.status]
  }

  /**
   * Draw `cost` from this socket's flood budget, refilling it for the time
   * elapsed since it was last drawn on. False means the client is going too
   * fast and the message should be dropped.
   */
  private spend(ws: WebSocket, attached: Attachment, cost: number): boolean {
    const now = Date.now()
    const refilled = Math.min(
      BUCKET_SIZE,
      attached.bucket.tokens + ((now - attached.bucket.at) / 1000) * REFILL_PER_SEC,
    )
    if (refilled < cost) {
      ws.serializeAttachment({ ...attached, bucket: { tokens: refilled, at: now } })
      return false
    }
    ws.serializeAttachment({
      ...attached,
      bucket: { tokens: refilled - cost, at: now },
    })
    return true
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private position(game: Game): Chess {
    if (game.mode === 'freeplay') {
      return new Chess(game.fens[game.fens.length - 1])
    }
    // Replay from the start so chess.js has the move history it needs to see
    // threefold repetition and the fifty-move rule.
    const chess = new Chess()
    for (const san of game.moves) chess.move(san)
    return chess
  }

  private turn(game: Game): Color {
    return game.fens[game.fens.length - 1].split(' ')[1] === 'w' ? 'white' : 'black'
  }

  private requirePlayer(seat: Seat): Color {
    if (seat === 'spectator') throw new Error('You are watching this game, not playing it.')
    return seat
  }

  private end(game: Game, result: Result) {
    game.status = 'over'
    game.result = result
    game.running = null
    game.since = null
    game.drawOfferFrom = null
    game.takebackOfferFrom = null
  }

  private publicState(game: Game): GameState {
    const connected: Record<Color, boolean> = { white: false, black: false }
    for (const ws of this.ctx.getWebSockets()) {
      const attachment = ws.deserializeAttachment() as Attachment | null
      if (attachment && attachment.seat !== 'spectator') connected[attachment.seat] = true
    }

    return {
      code: game.code,
      mode: game.mode,
      fen: game.fens[game.fens.length - 1],
      moves: game.moves,
      status: game.status,
      result: game.result,
      clock:
        game.time.initialMs > 0
          ? {
              whiteMs: this.remainingMs(game, 'white'),
              blackMs: this.remainingMs(game, 'black'),
              incrementMs: game.time.incrementMs,
              running: game.running,
              since: Date.now(),
            }
          : null,
      seats: { white: !!game.tokens.white, black: !!game.tokens.black },
      connected,
      chat: game.chat,
      drawOfferFrom: game.drawOfferFrom,
      takebackOfferFrom: game.takebackOfferFrom,
    }
  }

  private async save() {
    if (this.game) await this.ctx.storage.put('game', this.game)
  }

  private send(ws: WebSocket, message: ServerMessage) {
    try {
      ws.send(JSON.stringify(message))
    } catch {
      // The socket died between the check and the send; the close handler cleans up.
    }
  }

  private broadcast() {
    const game = this.game
    if (!game) return
    const message: ServerMessage = {
      t: 'state',
      state: this.publicState(game),
      now: Date.now(),
    }
    const payload = JSON.stringify(message)
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(payload)
      } catch {
        // Ignore; a dead socket will surface in webSocketClose.
      }
    }
  }
}

/** Hand the move to the other side, clearing any en-passant right. */
function flipTurn(fen: string): string {
  const parts = fen.split(' ')
  parts[1] = parts[1] === 'w' ? 'b' : 'w'
  parts[3] = '-'
  return parts.join(' ')
}

function label(color: Color): string {
  return color === 'white' ? 'White' : 'Black'
}

function describeResult(result: Result): string {
  if (result.reason === 'checkmate') return `Checkmate — ${label(result.winner!)} wins.`
  if (result.reason === 'stalemate') return 'Stalemate — draw.'
  if (result.reason === 'insufficient-material') return 'Draw: insufficient material.'
  if (result.reason === 'threefold-repetition') return 'Draw by repetition.'
  if (result.reason === 'fifty-move-rule') return 'Draw by the fifty-move rule.'
  return 'Game over.'
}
