import type { EngineEval } from '../../types'
import { formatScore, whiteAdvantageFraction } from '../../lib/chess'

/** A vertical eval bar: white fills from the bottom in proportion to advantage. */
export function EvalBar({ evaluation }: { evaluation: EngineEval | null }) {
  const fraction = evaluation ? whiteAdvantageFraction(evaluation) : 0.5
  const whitePct = Math.round(fraction * 100)
  const label = evaluation ? formatScore(evaluation) : '…'
  const whiteAhead = fraction >= 0.5

  return (
    <div
      className="relative h-full w-6 overflow-hidden rounded bg-ink"
      title="Engine evaluation (White's perspective)"
      aria-label={`Evaluation ${label}`}
    >
      <div
        className="absolute bottom-0 left-0 w-full bg-ice transition-[height] duration-300"
        style={{ height: `${whitePct}%` }}
      />
      <span
        className={`absolute left-1/2 -translate-x-1/2 text-[10px] font-semibold tabular-nums ${
          whiteAhead ? 'bottom-1 text-ink' : 'top-1 text-ice'
        }`}
      >
        {label}
      </span>
    </div>
  )
}
