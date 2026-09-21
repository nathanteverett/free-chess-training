import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MDXProvider } from '@mdx-js/react'
import { ArticleAudio } from '../components/media/ArticleAudio'
import { mdxComponents } from '../components/mdx/audio'
import { getAdjacentLessons, getLesson } from '../content/lessons'
import { getCategory, getCurriculum } from '../content/curriculum'
import { getLessonVideo } from '../content/videos'
import { getLessonPuzzles } from '../content/puzzles'
import { useProgress } from '../progress/ProgressContext'
import { YouTubeEmbed } from '../components/media/YouTubeEmbed'
import { GameLinks } from '../components/media/GameLinks'
import { PuzzleTrainer } from '../components/chess/PuzzleTrainer'

type Tab = 'article' | 'video' | 'puzzles' | 'games'

const TABS: { id: Tab; label: string }[] = [
  { id: 'article', label: 'Article' },
  { id: 'video', label: 'Video' },
  { id: 'puzzles', label: 'Puzzles' },
  { id: 'games', label: 'GM games' },
]

export function Lesson() {
  const { slug = '' } = useParams()
  const lesson = getLesson(slug)
  const { isLessonComplete, markLessonComplete, markLessonIncomplete } =
    useProgress()
  // The narration reads this element's text, so it has to be declared before
  // the not-found branch returns — hooks can't run conditionally.
  const articleRef = useRef<HTMLElement>(null)
  const [tab, setTab] = useState<Tab>('article')

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
  const puzzles = getLessonPuzzles(lesson)
  const games = lesson.games ?? []
  const complete = isLessonComplete(slug)
  const Article = lesson.Article
  const category = getCategory(lesson.category)
  const video = getLessonVideo(lesson)

  const siblings =
    getCurriculum().find((c) => c.id === lesson.category)?.lessons ?? []
  const position = siblings.findIndex((l) => l.slug === slug) + 1

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6">
      <nav className="flex items-center gap-1.5 text-xs text-neutral-500">
        <Link to="/" className="text-brand hover:underline">
          Dashboard
        </Link>
        <span>/</span>
        <Link
          to={`/category/${lesson.category}`}
          className="text-brand hover:underline"
        >
          {category?.name}
        </Link>
        <span>/</span>
        <span className="truncate text-neutral-700">{lesson.title}</span>
      </nav>

      <header className="flex flex-wrap items-start gap-5">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.07em] text-brand">
            {category?.name}
            {position > 0 && ` · Lesson ${position} of ${siblings.length}`}
          </span>
          <h1 className="text-3xl font-bold tracking-tight">{lesson.title}</h1>
          <p className="max-w-xl text-[15px] text-neutral-600 text-pretty">
            {lesson.summary}
          </p>
        </div>
        <button
          onClick={() =>
            complete ? markLessonIncomplete(slug) : markLessonComplete(slug)
          }
          className={`ml-auto shrink-0 whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-semibold hover:opacity-90 ${
            complete
              ? 'border-[#c6ead1] bg-[#f1faf4] text-[#166534]'
              : 'border-brand bg-brand text-white'
          }`}
        >
          {complete ? '✓ Completed' : 'Mark complete'}
        </button>
      </header>

      <div
        role="tablist"
        className="flex max-w-full gap-0.5 self-start overflow-x-auto rounded-[10px] bg-neutral-100 p-0.5"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 whitespace-nowrap rounded-lg px-4 py-1.5 text-[13px] font-semibold ${
              tab === t.id
                ? 'bg-white text-ink shadow-sm'
                : 'text-neutral-500 hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'article' && (
        <div className="flex flex-col gap-3 animate-[fadeIn_0.2s_ease_both]">
          <ArticleAudio articleRef={articleRef} articleKey={lesson.slug} />
          <section
            ref={articleRef}
            className="prose-lesson max-w-none rounded-xl border border-line bg-white px-6 py-6"
          >
            <MDXProvider components={mdxComponents}>
              <Article />
            </MDXProvider>
          </section>
        </div>
      )}

      {tab === 'video' && (
        <section className="animate-[fadeIn_0.2s_ease_both] rounded-xl border border-line bg-white p-6">
          <YouTubeEmbed
            videoId={video?.id}
            title={video?.title ?? lesson.title}
            channel={video?.channel}
          />
        </section>
      )}

      {/* Keep trainer state across tab switches, but reset it for a new lesson. */}
      <section
        key={lesson.slug}
        hidden={tab !== 'puzzles'}
        className={`${tab === 'puzzles' ? 'flex' : 'hidden'} animate-[fadeIn_0.2s_ease_both] flex-col gap-4`}
      >
        {puzzles.length > 0 ? (
          puzzles.map((puzzle, i) => (
            <PuzzleTrainer
              key={puzzle.id}
              puzzle={puzzle}
              index={i}
              total={puzzles.length}
            />
          ))
        ) : (
          <p className="rounded-xl border border-line bg-white p-6 text-sm text-neutral-500">
            No puzzles attached yet. Add puzzle ids to this lesson’s{' '}
            <code>puzzleIds</code> frontmatter.
          </p>
        )}
      </section>

      {tab === 'games' && (
        <section className="animate-[fadeIn_0.2s_ease_both] rounded-xl border border-line bg-white p-6">
          <GameLinks games={games} />
        </section>
      )}

      {/* Prev / next navigation */}
      <nav className="flex items-center justify-between gap-4 border-t border-line pt-4">
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
