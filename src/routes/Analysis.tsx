import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Chess } from 'chess.js'
import { useSearchParams } from 'react-router-dom'
import { BoardView } from '../components/chess/BoardView'
import { EvalBar } from '../components/chess/EvalBar'
import { useEngine } from '../engine/useEngine'
import { formatScore, uciLineToSan } from '../lib/chess'
import { lichessAnalysisUrl } from '../lib/lichess'
import { useBoardSize } from '../lib/useBoardSize'
import { getAnnotatedGame } from '../content/games'

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
const EVAL_BAR = 40

export function Analysis() {
  const [searchParams] = useSearchParams()
  const annotatedGame = getAnnotatedGame(searchParams.get('game'))
  const replayFens = useMemo(() => {
    if (!annotatedGame) return []
    const replay = new Chess()
    const positions = [replay.fen()]
    for (const move of annotatedGame.moves) {
      replay.move(move.san)
      positions.push(replay.fen())
    }
    return positions
  }, [annotatedGame])

  const gameRef = useRef(new Chess())
  const [fen, setFen] = useState(START_FEN)
  const [replayPly, setReplayPly] = useState(0)
  const [orientation, setOrientation] = useState<'white' | 'black'>('white')
  const [fenInput, setFenInput] = useState('')
  const [fenError, setFenError] = useState('')
  const { evaluation, analyzing, analyze } = useEngine()
  const { containerRef, size } = useBoardSize({ reserved: EVAL_BAR })

  useEffect(() => {
    analyze(fen, { depth: 18 })
  }, [fen, analyze])

  const goToPly = useCallback((ply: number) => {
    if (!annotatedGame) return
    const bounded = Math.max(0, Math.min(ply, annotatedGame.moves.length))
    const next = new Chess(replayFens[bounded])
    gameRef.current = next
    setReplayPly(bounded)
    setFen(next.fen())
  }, [annotatedGame, replayFens])

  useEffect(() => {
    if (annotatedGame) goToPly(0)
  }, [annotatedGame, goToPly])

  const syncFen = useCallback(() => setFen(gameRef.current.fen()), [])
  const onPieceDrop = useCallback((from: string, to: string): boolean => {
    if (annotatedGame) return false
    try {
      const move = gameRef.current.move({ from, to, promotion: 'q' })
      if (!move) return false
      syncFen()
      return true
    } catch {
      return false
    }
  }, [annotatedGame, syncFen])

  const undo = () => {
    if (annotatedGame) return goToPly(replayPly - 1)
    gameRef.current.undo()
    syncFen()
  }
  const reset = () => {
    if (annotatedGame) return goToPly(0)
    gameRef.current = new Chess()
    setFen(START_FEN)
  }
  const loadFen = () => {
    try {
      const next = new Chess(fenInput.trim())
      gameRef.current = next
      setFen(next.fen())
      setFenInput('')
      setFenError('')
    } catch {
      setFenError('That does not look like a valid FEN.')
    }
  }

  const line = evaluation ? uciLineToSan(fen, evaluation.pv, 8) : []
  const turn = gameRef.current.turn() === 'w' ? 'White' : 'Black'

  return (
    <div ref={containerRef} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{annotatedGame?.title ?? 'Analysis board'}</h1>
        <p className="text-sm text-neutral-500">
          {annotatedGame
            ? `${annotatedGame.white} vs ${annotatedGame.black} · ${annotatedGame.event}`
            : 'Play moves for both sides. Stockfish evaluates the position live — no account required.'}
        </p>
      </div>

      {annotatedGame && (
        <section className="rounded-xl border border-brand/30 bg-brand/5 p-4" aria-label="Annotated game controls">
          <div className="flex items-center justify-between gap-3">
            <button onClick={() => goToPly(replayPly - 1)} disabled={replayPly === 0} className={btn}>← Previous</button>
            <span className="text-sm font-medium tabular-nums">Move {replayPly} / {annotatedGame.moves.length}</span>
            <button onClick={() => goToPly(replayPly + 1)} disabled={replayPly === annotatedGame.moves.length} className={btn}>Next →</button>
          </div>
          {replayPly === 0 ? (
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">Step through every move to see its purpose and consequence.</p>
          ) : (
            <div className="mt-3">
              <p className="font-semibold">
                {Math.ceil(replayPly / 2)}{replayPly % 2 === 0 ? '…' : '.'} {annotatedGame.moves[replayPly - 1].san}
              </p>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{annotatedGame.moves[replayPly - 1].explanation}</p>
            </div>
          )}
          <div className="mt-3 flex max-h-28 flex-wrap gap-1 overflow-y-auto">
            {annotatedGame.moves.map((move, index) => (
              <button
                key={`${index}-${move.san}`}
                onClick={() => goToPly(index + 1)}
                className={`rounded px-2 py-1 text-xs ${replayPly === index + 1 ? 'bg-brand text-white' : 'bg-white/70 hover:bg-white dark:bg-neutral-800'}`}
                title={move.explanation}
              >
                {index % 2 === 0 && `${Math.floor(index / 2) + 1}.`}{move.san}
              </button>
            ))}
          </div>
          <a href={annotatedGame.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-xs text-brand hover:underline">
            Annotation source: Wikipedia ↗
          </a>
        </section>
      )}

      <div className="flex justify-center gap-3">
        <div style={{ height: size }}><EvalBar evaluation={evaluation} /></div>
        <BoardView fen={fen} orientation={orientation} onPieceDrop={onPieceDrop} arePiecesDraggable={!annotatedGame} maxWidth={size} />
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <button onClick={undo} disabled={annotatedGame ? replayPly === 0 : false} className={btn}>Undo</button>
        <button onClick={reset} className={btn}>Reset</button>
        <button onClick={() => setOrientation((o) => o === 'white' ? 'black' : 'white')} className={btn}>Flip board</button>
      </div>

      <div className={`grid gap-4 ${annotatedGame ? '' : 'sm:grid-cols-2'}`}>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-bold tabular-nums">{evaluation ? formatScore(evaluation) : '…'}</span>
            <span className="text-sm text-neutral-500">{analyzing ? 'analyzing…' : `depth ${evaluation?.depth ?? 0}`}</span>
            <span className="ml-auto text-sm text-neutral-500">{turn} to move</span>
          </div>
          {line.length > 0 && <p className="mt-2 text-sm"><span className="text-xs uppercase tracking-wide text-neutral-500">Best line: </span>{line.join(' ')}</p>}
          <a href={lichessAnalysisUrl(fen)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-medium text-brand hover:underline">Open this position in Lichess ↗</a>
        </div>

        {!annotatedGame && (
          <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <label className="mb-1 block text-sm font-medium">Load a position (FEN)</label>
            <div className="flex gap-2">
              <input value={fenInput} onChange={(e) => setFenInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadFen()} placeholder="paste FEN here" className="min-w-0 flex-1 rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800" />
              <button onClick={loadFen} className={btn}>Load</button>
            </div>
            {fenError && <p className="mt-1 text-xs text-red-600">{fenError}</p>}
          </div>
        )}
      </div>
    </div>
  )
}

const btn = 'rounded bg-neutral-200 px-3 py-1.5 text-sm font-medium hover:bg-neutral-300 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-700 dark:hover:bg-neutral-600'
