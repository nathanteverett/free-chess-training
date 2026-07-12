import { useEngine } from '../../engine/useEngine'
import { formatScore, uciLineToSan } from '../../lib/chess'
import { lichessAnalysisUrl } from '../../lib/lichess'
import type { EngineEval } from '../../types'

interface EnginePanelProps {
  /** Position to analyze. */
  fen: string
  /** Search depth (default 16). */
  depth?: number
  /** Optionally reuse an evaluation instead of running an internal engine. */
  externalEval?: EngineEval | null
  /** Hide the "Analyze" button (e.g. when the parent drives analysis). */
  autoOnly?: boolean
}

/**
 * A compact engine panel: score, best line (in SAN), and a link to open the
 * same position on Lichess for a second opinion. Runs the in-app Stockfish
 * worker on demand.
 */
export function EnginePanel({ fen, depth = 16 }: EnginePanelProps) {
  const { evaluation, analyzing, analyze, stop } = useEngine()

  const line = evaluation ? uciLineToSan(fen, evaluation.pv, 6) : []

  return (
    <div className="rounded-lg border border-neutral-300 bg-white/60 p-3 text-sm dark:border-neutral-700 dark:bg-neutral-900/60">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-semibold">Engine analysis</span>
        {analyzing ? (
          <button
            onClick={stop}
            className="rounded bg-neutral-200 px-2 py-1 text-xs font-medium hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600"
          >
            Stop
          </button>
        ) : (
          <button
            onClick={() => analyze(fen, { depth })}
            className="rounded bg-brand px-2 py-1 text-xs font-medium text-white hover:bg-brand-dark"
          >
            Analyze
          </button>
        )}
      </div>

      {evaluation && (evaluation.scoreCp !== null || evaluation.mateIn !== null) ? (
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold tabular-nums">
              {formatScore(evaluation)}
            </span>
            <span className="text-xs text-neutral-500">
              depth {evaluation.depth}
            </span>
          </div>
          {line.length > 0 && (
            <div className="text-neutral-700 dark:text-neutral-300">
              <span className="text-xs uppercase tracking-wide text-neutral-500">
                Best line:{' '}
              </span>
              {line.join(' ')}
            </div>
          )}
        </div>
      ) : (
        <p className="text-neutral-500">
          {analyzing ? 'Thinking…' : 'Click Analyze for the engine’s best move.'}
        </p>
      )}

      <a
        href={lichessAnalysisUrl(fen)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block text-xs font-medium text-brand hover:underline"
      >
        Open in Lichess analysis ↗
      </a>
    </div>
  )
}
