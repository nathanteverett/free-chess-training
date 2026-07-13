import { Link } from 'react-router-dom'
import { getAnnotatedGameForSource } from '../../content/games'
import type { GameLink } from '../../types'

/** Links wiki-backed games to a local, move-by-move annotated replay. */
export function GameLinks({ games }: { games: GameLink[] }) {
  if (games.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        No master games linked yet for this lesson.
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {games.map((game) => {
        const annotated = getAnnotatedGameForSource(game.url)
        const content = (
          <>
            <span className="mt-0.5 text-brand">♟</span>
            <span>
              <span className="font-medium">{game.label}</span>
              {game.note && (
                <span className="block text-sm text-neutral-500">
                  {game.note}
                </span>
              )}
              {annotated && (
                <span className="mt-1 block text-xs font-medium text-brand">
                  Replay {annotated.moves.length} annotated moves on the analysis board
                </span>
              )}
            </span>
            <span className="ml-auto text-neutral-400">→</span>
          </>
        )

        return (
          <li key={game.url}>
            {annotated ? (
              <Link
                to={`/analysis?game=${annotated.id}`}
                className="flex items-start gap-2 rounded-lg border border-neutral-200 bg-white/60 p-3 transition hover:border-brand hover:bg-brand/5 dark:border-neutral-700 dark:bg-neutral-900/60"
              >
                {content}
              </Link>
            ) : (
              <a
                href={game.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 rounded-lg border border-neutral-200 bg-white/60 p-3 transition hover:border-brand hover:bg-brand/5 dark:border-neutral-700 dark:bg-neutral-900/60"
              >
                {content}
              </a>
            )}
          </li>
        )
      })}
    </ul>
  )
}
