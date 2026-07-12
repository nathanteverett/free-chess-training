import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Chess } from 'chess.js'
import { BoardView } from './BoardView'
import { parseUci } from '../../lib/chess'
import { lichessAnalysisUrl } from '../../lib/lichess'
import { useProgress } from '../../progress/ProgressContext'
import type { Puzzle } from '../../types'

type Status = 'playing' | 'solved'
type Feedback = 'none' | 'correct' | 'wrong'

/**
 * Interactive puzzle: the learner plays the solving side's moves; correct moves
 * advance the line and the opponent's forced reply plays automatically. Wrong
 * moves snap back. A progressive hint control reveals hints one at a time, and
 * the puzzle's `idea` explanation appears once solved (or fully revealed).
 */
export function PuzzleTrainer({
  puzzle,
  index,
  total,
}: {
  puzzle: Puzzle
  index?: number
  total?: number
}) {
  const { isPuzzleSolved, markPuzzleSolved } = useProgress()
  const gameRef = useRef(new Chess(puzzle.fen))
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [fen, setFen] = useState(puzzle.fen)
  const [ply, setPly] = useState(0)
  const [status, setStatus] = useState<Status>('playing')
  const [feedback, setFeedback] = useState<Feedback>('none')
  const [attempts, setAttempts] = useState(0)
  const [revealedHints, setRevealedHints] = useState(0)
  const [showIdea, setShowIdea] = useState(false)

  const orientation = useMemo<'white' | 'black'>(
    () => (puzzle.fen.split(/\s+/)[1] === 'b' ? 'black' : 'white'),
    [puzzle.fen],
  )
  const alreadySolved = isPuzzleSolved(puzzle.id)

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    gameRef.current = new Chess(puzzle.fen)
    setFen(puzzle.fen)
    setPly(0)
    setStatus('playing')
    setFeedback('none')
    setAttempts(0)
    setRevealedHints(0)
    setShowIdea(false)
  }, [puzzle.fen])

  // Reset when navigating to a different puzzle.
  useEffect(() => {
    reset()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [reset])

  const onPieceDrop = useCallback(
    (from: string, to: string): boolean => {
      if (status !== 'playing') return false
      const expected = puzzle.solution[ply]
      if (!expected) return false
      const exp = parseUci(expected)

      // Match on from/to; apply the expected move so any promotion is exact.
      if (from !== exp.from || to !== exp.to) {
        setAttempts((a) => a + 1)
        setFeedback('wrong')
        return false
      }

      gameRef.current.move(parseUci(expected))
      const afterSolver = ply + 1
      setFen(gameRef.current.fen())
      setFeedback('correct')

      if (afterSolver >= puzzle.solution.length) {
        setPly(afterSolver)
        setStatus('solved')
        setShowIdea(true)
        markPuzzleSolved(puzzle.id)
        return true
      }

      // Auto-play the opponent's forced reply.
      setPly(afterSolver)
      timerRef.current = setTimeout(() => {
        const reply = puzzle.solution[afterSolver]
        if (reply) {
          gameRef.current.move(parseUci(reply))
          setFen(gameRef.current.fen())
          setPly(afterSolver + 1)
        }
      }, 350)
      return true
    },
    [ply, puzzle.id, puzzle.solution, status, markPuzzleSolved],
  )

  const revealNextHint = () => {
    setRevealedHints((n) => Math.min(n + 1, puzzle.hints.length))
  }

  const solverMovesPlayed = Math.ceil(ply / 2)
  const solverMovesTotal = Math.ceil(puzzle.solution.length / 2)

  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          {typeof index === 'number' && typeof total === 'number' && (
            <span className="font-medium">
              Puzzle {index + 1} / {total}
            </span>
          )}
          <span className="rounded bg-neutral-200 px-2 py-0.5 text-xs uppercase tracking-wide dark:bg-neutral-700">
            {puzzle.theme}
          </span>
          {alreadySolved && (
            <span className="text-green-600" title="Solved previously">
              ✓ solved
            </span>
          )}
        </div>
        <span className="text-xs text-neutral-500">
          {orientation === 'white' ? 'White' : 'Black'} to move
        </span>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <BoardView
          fen={fen}
          orientation={orientation}
          onPieceDrop={onPieceDrop}
          arePiecesDraggable={status === 'playing'}
          maxWidth={380}
        />

        <div className="flex-1 space-y-3">
          {/* Feedback line */}
          <div className="min-h-6 text-sm font-medium">
            {status === 'solved' ? (
              <span className="text-green-600">Solved! Well done. ♟</span>
            ) : feedback === 'wrong' ? (
              <span className="text-red-600">
                Not quite — try another move.
              </span>
            ) : feedback === 'correct' ? (
              <span className="text-green-600">
                Correct — keep the line going.
              </span>
            ) : (
              <span className="text-neutral-500">
                Find the best move for {orientation}.
              </span>
            )}
          </div>

          <div className="text-xs text-neutral-500">
            Progress: {solverMovesPlayed} / {solverMovesTotal} moves
            {attempts > 0 && status !== 'solved' && ` · ${attempts} misses`}
          </div>

          {/* Hints */}
          <div className="space-y-1">
            {puzzle.hints.slice(0, revealedHints).map((hint, i) => (
              <p
                key={i}
                className="rounded bg-amber-50 px-2 py-1 text-sm text-amber-900 dark:bg-amber-900/20 dark:text-amber-200"
              >
                <span className="font-semibold">Hint {i + 1}:</span> {hint}
              </p>
            ))}
            {revealedHints < puzzle.hints.length && status !== 'solved' && (
              <button
                onClick={revealNextHint}
                className="rounded bg-amber-100 px-3 py-1 text-sm font-medium text-amber-900 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-200"
              >
                {revealedHints === 0 ? 'Show a hint' : 'Show next hint'}
              </button>
            )}
          </div>

          {/* Idea explanation */}
          {showIdea ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm dark:border-green-900 dark:bg-green-900/20">
              <p className="mb-1 font-semibold text-green-800 dark:text-green-300">
                The idea
              </p>
              <p className="text-green-900 dark:text-green-100">{puzzle.idea}</p>
            </div>
          ) : (
            status !== 'solved' && (
              <button
                onClick={() => setShowIdea(true)}
                className="text-sm text-neutral-500 underline hover:text-neutral-700"
              >
                Reveal the idea (spoiler)
              </button>
            )
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={reset}
              className="rounded bg-neutral-200 px-3 py-1 text-sm font-medium hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600"
            >
              Reset
            </button>
            <a
              href={lichessAnalysisUrl(fen)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded px-3 py-1 text-sm font-medium text-brand hover:underline"
            >
              Analyze on Lichess ↗
            </a>
          </div>

          {puzzle.source && (
            <p className="pt-1 text-xs text-neutral-400">{puzzle.source}</p>
          )}
        </div>
      </div>
    </div>
  )
}
