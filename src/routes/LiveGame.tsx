import { useEffect, useState, type CSSProperties } from 'react'
import { Chess } from 'chess.js'
import { Link, useParams } from 'react-router-dom'
import { BoardView } from '../components/chess/BoardView'
import { EvalBar } from '../components/chess/EvalBar'
import { Chat } from '../components/live/Chat'
import { Clock } from '../components/live/Clock'
import { MoveList } from '../components/live/MoveList'
import { useEngine } from '../engine/useEngine'
import { formatScore, uciLineToSan } from '../lib/chess'
import { lichessAnalysisUrl } from '../lib/lichess'
import { inviteUrl } from '../live/api'
import { useLiveGame } from '../live/useLiveGame'
import { useBoardSize } from '../lib/useBoardSize'
import type { Color, GameState, Result, Seat } from '../../shared/protocol'
import type { EngineEval } from '../types'

const btn =
  'rounded bg-neutral-200 px-3 py-1.5 text-sm font-medium hover:bg-neutral-300 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-700 dark:hover:bg-neutral-600'

/** Height of the two player bars (name + clock) stacked around the board. */
const PLAYER_BARS = 72
/** Vertical space the page chrome takes above and below the board. */
const CHROME = 270
/** Width the eval bar and its gutter take beside the board. */
const EVAL_BAR = 40
/** The invite banner only shows until an opponent arrives, but while it does it
 * pushes the board down, so the board has that much less height to work with. */
const INVITE_BANNER = 160

export function LiveGame() {
  const { code = '' } = useParams()
  const { state, you, connection, error, serverOffset, send, dismissError } =
    useLiveGame(code)

  // The engine belongs on the shared analysis board and nowhere else: handing a
  // player Stockfish during a refereed game is just cheating with extra steps.
  const analysisBoard = state?.mode === 'freeplay'
  const { evaluation, analyzing, analyze } = useEngine()

  const { containerRef, size } = useBoardSize({
    chrome: CHROME + (state?.status === 'waiting' ? INVITE_BANNER : 0),
    reserved: analysisBoard ? EVAL_BAR : 0,
  })

  // Show the move the moment it is dropped rather than a round-trip later; the
  // next server state overwrites it, so a rejected move simply snaps back.
  const [optimisticFen, setOptimisticFen] = useState<string | null>(null)
  useEffect(() => setOptimisticFen(null), [state, error])

  // Evaluate the position the server has confirmed, not the optimistic one, so a
  // move costs one search rather than two.
  const serverFen = state?.fen
  useEffect(() => {
    if (!analysisBoard || !serverFen) return
    analyze(serverFen, { depth: 18 })
  }, [analysisBoard, serverFen, analyze])

  if (!state) {
    return (
      <p className="text-sm text-neutral-500">
        {connection === 'open' ? 'Loading game…' : `Connecting to ${code}…`}
      </p>
    )
  }

  const orientation: Color = you === 'black' ? 'black' : 'white'
  const opponent: Color = orientation === 'white' ? 'black' : 'white'
  const isPlayer = you === 'white' || you === 'black'
  const yourTurn =
    isPlayer &&
    state.status === 'active' &&
    (state.mode === 'freeplay' || turnOf(state.fen) === you)

  const onPieceDrop = (from: string, to: string): boolean => {
    if (!yourTurn) return false

    // Mirror the server's rule locally so the piece only moves if the move will
    // actually be accepted. In freeplay either colour may move, so hand the
    // turn to whichever piece was touched first.
    const chess = new Chess(state.fen)
    const piece = chess.get(from as never)
    if (!piece) return false
    if (state.mode === 'referee' && piece.color !== chess.turn()) return false
    if (state.mode === 'freeplay' && piece.color !== chess.turn()) {
      chess.load(flipTurn(state.fen), { skipValidation: true })
    }

    try {
      if (!chess.move({ from, to, promotion: 'q' })) return false
    } catch {
      return false
    }

    setOptimisticFen(chess.fen())
    send({ t: 'move', from, to, promotion: 'q' })
    return true
  }

  const drawFromOpponent = state.drawOfferFrom && state.drawOfferFrom !== you
  const takebackFromOpponent = state.takebackOfferFrom && state.takebackOfferFrom !== you

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-baseline gap-x-3">
        <h1 className="text-2xl font-bold">
          {state.mode === 'freeplay' ? 'Shared analysis board' : 'Live game'}
        </h1>
        <span className="font-mono text-lg tracking-widest">{state.code}</span>
        <span className="ml-auto text-sm text-neutral-500">
          {connection === 'open' ? seatLabel(you) : 'Reconnecting…'}
        </span>
      </header>

      {state.status === 'waiting' && <Invite code={state.code} />}

      {state.status === 'over' && state.result && (
        <p className="rounded-lg border border-brand/40 bg-brand/10 px-4 py-3 font-semibold">
          {describeResult(state.result)}
        </p>
      )}

      {error && (
        <p
          onClick={dismissError}
          className="cursor-pointer rounded-lg bg-red-100 px-4 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          {error} <span className="opacity-60">(dismiss)</span>
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div ref={containerRef}>
          <div
            className="mx-auto space-y-2"
            style={{ maxWidth: size + (analysisBoard ? EVAL_BAR : 0) }}
          >
            <PlayerBar state={state} color={opponent} serverOffset={serverOffset} />
            <div className="flex gap-3">
              {analysisBoard && (
                <div style={{ height: size }}>
                  <EvalBar evaluation={evaluation} orientation={orientation} />
                </div>
              )}
              <BoardView
                fen={optimisticFen ?? state.fen}
                orientation={orientation}
                onPieceDrop={onPieceDrop}
                arePiecesDraggable={yourTurn}
                maxWidth={size}
              />
            </div>
            <PlayerBar state={state} color={orientation} serverOffset={serverOffset} />
          </div>
        </div>

        {/* Side rail: the move list grows to fill the board's height, the chat
            stays a fixed bar pinned beneath it. */}
        <div
          className="flex flex-col gap-3 lg:h-[var(--rail-height)]"
          style={{ '--rail-height': `${size + PLAYER_BARS}px` } as CSSProperties}
        >
          {analysisBoard && (
            <EngineReadout fen={state.fen} evaluation={evaluation} analyzing={analyzing} />
          )}

          <MoveList moves={state.moves} className="h-32 lg:h-auto lg:min-h-24 lg:flex-1" />

          {isPlayer && state.status === 'active' && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => send({ t: 'offer', kind: 'takeback' })}
                disabled={state.moves.length === 0}
                className={btn}
              >
                {state.mode === 'freeplay' ? 'Take back' : 'Ask for takeback'}
              </button>
              {state.mode === 'referee' && (
                <>
                  <button
                    onClick={() => send({ t: 'offer', kind: 'draw' })}
                    disabled={!!state.drawOfferFrom}
                    className={btn}
                  >
                    Offer draw
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Resign this game?')) send({ t: 'resign' })
                    }}
                    className={btn}
                  >
                    Resign
                  </button>
                </>
              )}
            </div>
          )}

          {isPlayer && (drawFromOpponent || takebackFromOpponent) && (
            <div className="rounded-lg border border-brand/40 bg-brand/10 p-3 text-sm">
              <p className="font-medium">
                {drawFromOpponent
                  ? 'Your opponent offers a draw.'
                  : 'Your opponent wants to take back a move.'}
              </p>
              <div className="mt-2 flex gap-2">
                {(['accept', 'decline'] as const).map((choice) => (
                  <button
                    key={choice}
                    onClick={() =>
                      send({
                        t: 'respond',
                        kind: drawFromOpponent ? 'draw' : 'takeback',
                        accept: choice === 'accept',
                      })
                    }
                    className={btn}
                  >
                    {choice === 'accept' ? 'Accept' : 'Decline'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Chat
            messages={state.chat}
            onSend={(text) => send({ t: 'chat', text })}
            disabled={connection !== 'open'}
            className="h-48 shrink-0"
          />

          <Link to="/play" className="text-sm text-brand hover:underline">
            ← Start another game
          </Link>
        </div>
      </div>
    </div>
  )
}

function Invite({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const url = inviteUrl(code)

  const copy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="rounded-xl border border-brand/40 bg-brand/5 p-4">
      <h2 className="font-semibold">Waiting for your opponent</h2>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
        Send them this code — or the link — and the game starts the moment they
        arrive.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="rounded-lg bg-white px-4 py-2 font-mono text-2xl font-bold tracking-[0.3em] dark:bg-neutral-900">
          {code}
        </span>
        <button onClick={copy} className={btn}>
          {copied ? 'Copied!' : 'Copy invite link'}
        </button>
      </div>
    </section>
  )
}

/**
 * Score, depth and best line for the shared analysis board. Both players see the
 * same evaluation, but each browser computes it — the server never sees a FEN.
 */
function EngineReadout({
  fen,
  evaluation,
  analyzing,
}: {
  fen: string
  evaluation: EngineEval | null
  analyzing: boolean
}) {
  const line = evaluation ? uciLineToSan(fen, evaluation.pv, 6) : []

  return (
    <section
      className="shrink-0 rounded-lg border border-neutral-200 bg-white p-3 text-sm dark:border-neutral-800 dark:bg-neutral-900"
      aria-label="Engine analysis"
    >
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-bold tabular-nums">
          {evaluation ? formatScore(evaluation) : '…'}
        </span>
        <span className="text-xs text-neutral-500">
          {analyzing ? 'analyzing…' : `depth ${evaluation?.depth ?? 0}`}
        </span>
      </div>
      {line.length > 0 && (
        <p className="mt-1 text-xs text-neutral-700 dark:text-neutral-300">
          <span className="uppercase tracking-wide text-neutral-500">Best line: </span>
          {line.join(' ')}
        </p>
      )}
      <a
        href={lichessAnalysisUrl(fen)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block text-xs font-medium text-brand hover:underline"
      >
        Open in Lichess ↗
      </a>
    </section>
  )
}

function PlayerBar({
  state,
  color,
  serverOffset,
}: {
  state: GameState
  color: Color
  serverOffset: number
}) {
  const here = state.connected[color]
  const seated = state.seats[color]

  return (
    <div className="flex items-center gap-3">
      <span className="font-medium">{color === 'white' ? 'White' : 'Black'}</span>
      <span className="text-xs text-neutral-500">
        {!seated ? 'empty seat' : here ? 'connected' : 'away — may reconnect'}
      </span>
      <div className="ml-auto">
        <Clock state={state} color={color} serverOffset={serverOffset} />
      </div>
    </div>
  )
}

function turnOf(fen: string): Color {
  return fen.split(' ')[1] === 'w' ? 'white' : 'black'
}

function flipTurn(fen: string): string {
  const parts = fen.split(' ')
  parts[1] = parts[1] === 'w' ? 'b' : 'w'
  parts[3] = '-'
  return parts.join(' ')
}

function seatLabel(you: Seat | null): string {
  if (you === 'white') return 'You are White'
  if (you === 'black') return 'You are Black'
  return 'Watching'
}

function describeResult(result: Result): string {
  const winner = result.winner === 'white' ? 'White' : 'Black'
  switch (result.reason) {
    case 'checkmate':
      return `Checkmate — ${winner} wins.`
    case 'resignation':
      return `${result.winner === 'white' ? 'Black' : 'White'} resigned — ${winner} wins.`
    case 'timeout':
      return `${result.winner === 'white' ? 'Black' : 'White'} ran out of time — ${winner} wins.`
    case 'draw-agreed':
      return 'Draw agreed.'
    case 'stalemate':
      return 'Stalemate — draw.'
    case 'insufficient-material':
      return 'Draw: insufficient material.'
    case 'threefold-repetition':
      return 'Draw by repetition.'
    case 'fifty-move-rule':
      return 'Draw by the fifty-move rule.'
  }
}
