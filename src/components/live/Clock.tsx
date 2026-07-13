import type { Color, GameState } from '../../../shared/protocol'
import { useRemainingMs } from '../../live/useLiveGame'

function format(ms: number): string {
  const total = Math.ceil(ms / 1000)
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  // Under ten seconds, tenths matter more than tidiness.
  if (ms < 10_000) return (ms / 1000).toFixed(1)
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function Clock({
  state,
  color,
  serverOffset,
}: {
  state: GameState
  color: Color
  serverOffset: number
}) {
  const remaining = useRemainingMs(state, color, serverOffset)
  if (!state.clock) return null

  const running = state.clock.running === color
  const low = remaining < 30_000

  return (
    <div
      className={`rounded-lg border px-4 py-2 text-2xl font-bold tabular-nums transition-colors ${
        running
          ? 'border-brand bg-brand/10'
          : 'border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900'
      } ${low && running ? 'text-red-600' : ''}`}
      aria-label={`${color} clock`}
    >
      {format(remaining)}
    </div>
  )
}
