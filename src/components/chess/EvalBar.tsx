import type { EngineEval } from '../../types'
import { formatScore, whiteAdvantageFraction } from '../../lib/chess'

/** A vertical eval bar: white fills from the bottom in proportion to advantage. */
export function EvalBar({
  evaluation,
  orientation = 'white',
}: {
  evaluation: EngineEval | null
  orientation?: 'white' | 'black'
}) {
  const fraction = evaluation ? whiteAdvantageFraction(evaluation) : 0.5
  const whitePct = Math.round(fraction * 100)
  const label = evaluation ? formatScore(evaluation) : '…'
  const whiteAhead = fraction >= 0.5
  // White fills from whichever end White's back rank is on.
  const flipped = orientation === 'black'
  const fillEdge = flipped ? 'top-0' : 'bottom-0'
  const labelEdge = whiteAhead === flipped ? 'top-1' : 'bottom-1'

  return (
    <div
      className="relative h-full w-6 overflow-hidden rounded bg-ink"
      title="Engine evaluation (White's perspective)"
      aria-label={`Evaluation ${label}`}
    >
      <div
        className={`absolute ${fillEdge} left-0 w-full bg-page transition-[height] duration-300`}
        style={{ height: `${whitePct}%` }}
      />
      <span
        className={`absolute left-1/2 -translate-x-1/2 text-[10px] font-semibold tabular-nums ${labelEdge} ${
          whiteAhead ? 'text-ink' : 'text-page'
        }`}
      >
        {label}
      </span>
    </div>
  )
}
