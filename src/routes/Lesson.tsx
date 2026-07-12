import { Link, useParams } from 'react-router-dom'
import { MDXProvider } from '@mdx-js/react'
import { getAdjacentLessons, getLesson } from '../content/lessons'
import { getPuzzles } from '../content/puzzles'
import { useProgress } from '../progress/ProgressContext'
import { YouTubeEmbed } from '../components/media/YouTubeEmbed'
import { GameLinks } from '../components/media/GameLinks'
import { PuzzleTrainer } from '../components/chess/PuzzleTrainer'

export function Lesson() {
  const { slug = '' } = useParams()
  const lesson = getLesson(slug)
  const { isLessonComplete, markLessonComplete, markLessonIncomplete } =
    useProgress()

  if (!lesson) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-medium">Lesson not found.</p>
        <Link to="/" className="mt-2 inline-block text-brand hover:underline">
          ← Back to curriculum
        </Link>
      </div>
    )
  }

  const { prev, next } = getAdjacentLessons(slug)
  const puzzles = getPuzzles(lesson.puzzleIds)
  const games = lesson.games ?? []
  const complete = isLessonComplete(slug)
  const Article = lesson.Article

  return (
    <article className="space-y-8">
      <header>
        <p className="text-sm font-medium text-brand">
          {lesson.module} · {lesson.stage}
        </p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{lesson.title}</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          {lesson.summary}
        </p>
      </header>

      {/* Video */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Video</h2>
        <YouTubeEmbed videoId={lesson.youtubeId ?? ''} title={lesson.title} />
      </section>

      {/* Article (MDX body) */}
      <section className="prose-lesson max-w-none">
        <MDXProvider>
          <Article />
        </MDXProvider>
      </section>

      {/* Puzzles */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">
          Practice puzzles{' '}
          {puzzles.length > 0 && (
            <span className="text-sm font-normal text-neutral-500">
              ({puzzles.length})
            </span>
          )}
        </h2>
        {puzzles.length > 0 ? (
          <div className="space-y-4">
            {puzzles.map((puzzle, i) => (
              <PuzzleTrainer
                key={puzzle.id}
                puzzle={puzzle}
                index={i}
                total={puzzles.length}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">
            No puzzles attached yet. Add puzzle ids to this lesson’s{' '}
            <code>puzzleIds</code> frontmatter.
          </p>
        )}
      </section>

      {/* Grandmaster games */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Grandmaster games</h2>
        <GameLinks games={games} />
      </section>

      {/* Completion toggle */}
      <section className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={complete}
            onChange={(e) =>
              e.target.checked
                ? markLessonComplete(slug)
                : markLessonIncomplete(slug)
            }
            className="h-5 w-5 accent-[var(--color-brand)]"
          />
          <span className="font-medium">
            {complete ? 'Lesson completed' : 'Mark this lesson complete'}
          </span>
        </label>
      </section>

      {/* Prev / next navigation */}
      <nav className="flex items-center justify-between gap-4 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        {prev ? (
          <Link
            to={`/lesson/${prev.slug}`}
            className="max-w-[45%] text-sm text-brand hover:underline"
          >
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            to={`/lesson/${next.slug}`}
            className="max-w-[45%] text-right text-sm text-brand hover:underline"
          >
            {next.title} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  )
}
