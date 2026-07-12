import type { GameLink } from '../../types'

/**
 * A list of grandmaster games that demonstrate the lesson's idea. Links open in
 * a new tab (Lichess study, chessgames.com, etc.). An embedded PGN viewer can
 * replace the links later without changing the lesson data.
 */
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
      {games.map((game) => (
        <li key={game.url}>
          <a
            href={game.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2 rounded-lg border border-neutral-200 bg-white/60 p-3 transition hover:border-brand hover:bg-brand/5 dark:border-neutral-700 dark:bg-neutral-900/60"
          >
            <span className="mt-0.5 text-brand">♟</span>
            <span>
              <span className="font-medium">{game.label}</span>
              {game.note && (
                <span className="block text-sm text-neutral-500">
                  {game.note}
                </span>
              )}
            </span>
            <span className="ml-auto text-neutral-400">↗</span>
          </a>
        </li>
      ))}
    </ul>
  )
}
