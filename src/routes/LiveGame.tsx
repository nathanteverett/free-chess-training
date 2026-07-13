import { useEffect, useState } from 'react'
import { Chess } from 'chess.js'
import { Link, useParams } from 'react-router-dom'
import { BoardView } from '../components/chess/BoardView'
import { Chat } from '../components/live/Chat'
import { Clock } from '../components/live/Clock'
import { MoveList } from '../components/live/MoveList'
import { inviteUrl } from '../live/api'
import { useLiveGame } from '../live/useLiveGame'
import type { Color, GameState, Result, Seat } from '../../shared/protocol'

const btn =
  'rounded bg-neutral-200 px-3 py-1.5 text-sm font-medium hover:bg-neutral-300 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-700 dark:hover:bg-neutral-600'

export function LiveGame() {
  const { code = '' } = useParams()
  const { state, you, connection, error, serverOffset, send, dismissError } =
    useLiveGame(code)

  // Show the move the moment it is dropped rather than a round-trip later; the
  // next server state overwrites it, so a rejected move simply snaps back.
  const [optimisticFen, setOptimisticFen] = useState<string | null>(null)
  useEffect(() => setOptimisticFen(null), [state, error])

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

      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        <div className="space-y-2">
          <PlayerBar state={state} color={opponent} serverOffset={serverOffset} />
          <BoardView
            fen={optimisticFen ?? state.fen}
            orientation={orientation}
            onPieceDrop={onPieceDrop}
            arePiecesDraggable={yourTurn}
          />
          <PlayerBar state={state} color={orientation} serverOffset={serverOffset} />
        </div>

        <div className="space-y-4">
          <MoveList moves={state.moves} />

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
          />

          <Link to="/play" className="inline-block text-sm text-brand hover:underline">
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
