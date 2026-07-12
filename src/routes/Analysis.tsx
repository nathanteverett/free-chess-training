import { useCallback, useEffect, useRef, useState } from 'react'
import { Chess } from 'chess.js'
import { BoardView } from '../components/chess/BoardView'
import { EvalBar } from '../components/chess/EvalBar'
import { useEngine } from '../engine/useEngine'
import { formatScore, uciLineToSan } from '../lib/chess'
import { lichessAnalysisUrl } from '../lib/lichess'

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

export function Analysis() {
  const gameRef = useRef(new Chess())
  const [fen, setFen] = useState(START_FEN)
  const [orientation, setOrientation] = useState<'white' | 'black'>('white')
  const [fenInput, setFenInput] = useState('')
  const [fenError, setFenError] = useState('')
  const { evaluation, analyzing, analyze } = useEngine()

  // Re-analyze whenever the position changes.
  useEffect(() => {
    analyze(fen, { depth: 18 })
  }, [fen, analyze])

  const syncFen = useCallback(() => setFen(gameRef.current.fen()), [])

  const onPieceDrop = useCallback(
    (from: string, to: string): boolean => {
      try {
        const move = gameRef.current.move({ from, to, promotion: 'q' })
        if (!move) return false
        syncFen()
        return true
      } catch {
        return false
      }
    },
    [syncFen],
  )

  const undo = () => {
    gameRef.current.undo()
    syncFen()
  }
  const reset = () => {
    gameRef.current = new Chess()
    setFen(START_FEN)
  }
  const loadFen = () => {
    const value = fenInput.trim()
    if (!value) return
    try {
      const next = new Chess(value)
      gameRef.current = next
      setFen(next.fen())
      setFenError('')
      setFenInput('')
    } catch {
      setFenError('That does not look like a valid FEN.')
    }
  }

  const line = evaluation ? uciLineToSan(fen, evaluation.pv, 8) : []
  const turn = gameRef.current.turn() === 'w' ? 'White' : 'Black'

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Analysis board</h1>
        <p className="text-sm text-neutral-500">
          Play moves for both sides. Stockfish evaluates the position live — no
          account, no server, runs entirely in your browser.
        </p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex gap-3">
          <div className="h-[min(80vw,480px)]">
            <EvalBar evaluation={evaluation} />
          </div>
          <BoardView
            fen={fen}
            orientation={orientation}
            onPieceDrop={onPieceDrop}
            maxWidth={480}
          />
        </div>

        <div className="flex-1 space-y-4">
          <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold tabular-nums">
                {evaluation ? formatScore(evaluation) : '…'}
              </span>
              <span className="text-sm text-neutral-500">
                {analyzing ? 'analyzing…' : 'depth ' + (evaluation?.depth ?? 0)}
              </span>
              <span className="ml-auto text-sm text-neutral-500">
                {turn} to move
              </span>
            </div>
            {line.length > 0 && (
              <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
                <span className="text-xs uppercase tracking-wide text-neutral-500">
                  Best line:{' '}
                </span>
                {line.join(' ')}
              </p>
            )}
            <a
              href={lichessAnalysisUrl(fen)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-sm font-medium text-brand hover:underline"
            >
              Open this position in Lichess ↗
            </a>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={undo} className={btn}>
              Undo
            </button>
            <button onClick={reset} className={btn}>
              Reset
            </button>
            <button
              onClick={() =>
                setOrientation((o) => (o === 'white' ? 'black' : 'white'))
              }
              className={btn}
            >
              Flip board
            </button>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <label className="mb-1 block text-sm font-medium">
              Load a position (FEN)
            </label>
            <div className="flex gap-2">
              <input
                value={fenInput}
                onChange={(e) => setFenInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadFen()}
                placeholder="paste FEN here"
                className="min-w-0 flex-1 rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
              />
              <button onClick={loadFen} className={btn}>
                Load
              </button>
            </div>
            {fenError && (
              <p className="mt-1 text-xs text-red-600">{fenError}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const btn =
  'rounded bg-neutral-200 px-3 py-1.5 text-sm font-medium hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600'
