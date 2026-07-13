/**
 * Wire protocol shared by the live-game Worker and the browser client.
 *
 * The server is authoritative and, after every mutation, broadcasts the whole
 * `GameState` rather than a delta. A game is a few kilobytes at most, so the
 * simplicity of "one message type, never out of sync" is worth more than the
 * bytes a delta protocol would save.
 */

export type Color = 'white' | 'black'
export type Seat = Color | 'spectator'

/**
 * `referee` — the server enforces turn order and legality and calls the result.
 * `freeplay` — a shared analysis board: either player may move either side and
 * take moves back freely. Moves must still be legal chess, but nothing else is
 * enforced; checkmate is the only result the server declares. Always untimed.
 */
export type Mode = 'referee' | 'freeplay'

export type EndReason =
  | 'checkmate'
  | 'stalemate'
  | 'insufficient-material'
  | 'threefold-repetition'
  | 'fifty-move-rule'
  | 'resignation'
  | 'timeout'
  | 'draw-agreed'

export interface Result {
  /** null on a draw. */
  winner: Color | null
  reason: EndReason
}

export interface ClockState {
  whiteMs: number
  blackMs: number
  incrementMs: number
  /** Whose clock is counting down, or null if no clock is running. */
  running: Color | null
  /**
   * Server timestamp the running side's remaining time was last computed at.
   * Clients tick down from here, correcting for their own drift using the
   * `now` field on every server message.
   */
  since: number
}

export interface ChatMessage {
  id: number
  from: Seat | 'system'
  text: string
  at: number
}

export interface GameState {
  code: string
  mode: Mode
  /** Current position. */
  fen: string
  /** Moves so far, in SAN. */
  moves: string[]
  status: 'waiting' | 'active' | 'over'
  result: Result | null
  /** null in freeplay, or when the host chose no time control. */
  clock: ClockState | null
  /** Which seats are taken. A seat stays taken while its player is away. */
  seats: Record<Color, boolean>
  /** Which seats currently have a live connection. */
  connected: Record<Color, boolean>
  chat: ChatMessage[]
  drawOfferFrom: Color | null
  takebackOfferFrom: Color | null
}

export interface TimeControl {
  /** 0 means untimed. */
  initialMs: number
  incrementMs: number
}

export interface CreateGameRequest {
  mode: Mode
  time: TimeControl
  hostColor: Color | 'random'
}

export interface CreateGameResponse {
  code: string
  /** The host's seat token — see `ClientMessage['join']`. */
  token: string
  color: Color
}

/** Messages the browser sends. */
export type ClientMessage =
  /**
   * `token` is the opaque seat token minted on first join and kept in
   * localStorage. It is not an account: it is meaningless outside this game,
   * and it exists so a refresh or a dropped connection can reclaim its seat.
   * Joining without one takes a free seat, or spectates if both are taken.
   */
  | { t: 'join'; token?: string }
  | { t: 'move'; from: string; to: string; promotion?: string }
  | { t: 'resign' }
  | { t: 'offer'; kind: 'draw' | 'takeback' }
  | { t: 'respond'; kind: 'draw' | 'takeback'; accept: boolean }
  | { t: 'chat'; text: string }

/** Messages the server sends. `now` is the server clock, for drift correction. */
export type ServerMessage =
  | { t: 'welcome'; you: Seat; token: string; state: GameState; now: number }
  | { t: 'state'; state: GameState; now: number }
  | { t: 'error'; message: string }

export const MAX_CHAT_LENGTH = 300
export const MAX_CHAT_HISTORY = 100

export const TIME_CONTROLS: { label: string; time: TimeControl }[] = [
  { label: 'Untimed', time: { initialMs: 0, incrementMs: 0 } },
  { label: '3 + 2 blitz', time: { initialMs: 180_000, incrementMs: 2_000 } },
  { label: '5 + 0 blitz', time: { initialMs: 300_000, incrementMs: 0 } },
  { label: '10 + 0 rapid', time: { initialMs: 600_000, incrementMs: 0 } },
  { label: '15 + 10 classical', time: { initialMs: 900_000, incrementMs: 10_000 } },
]

/** Unambiguous alphabet: no O/0, I/1, L. Codes are read aloud and retyped. */
export const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
export const CODE_LENGTH = 6

export function isValidCode(code: string): boolean {
  return (
    code.length === CODE_LENGTH &&
    [...code].every((c) => CODE_ALPHABET.includes(c))
  )
}
