import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getCurriculum } from '../content/curriculum'
import { useProgress } from '../progress/ProgressContext'

export function Home() {
  const curriculum = getCurriculum()
  const { isLessonComplete, completedLessons } = useProgress()
  const totalLessons = curriculum.reduce((n, c) => n + c.lessons.length, 0)

  // Open the first category by default; the rest start collapsed so the whole
  // curriculum fits on one screen as a scannable list.
  const [open, setOpen] = useState<Set<string>>(
    () => new Set(curriculum.length ? [curriculum[0].id] : []),
  )

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const allOpen = open.size === curriculum.length
  const toggleAll = () =>
    setOpen(allOpen ? new Set() : new Set(curriculum.map((c) => c.id)))

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-linear-to-br from-brand to-brand-dark p-6 text-white">
        <h1 className="text-2xl font-bold sm:text-3xl">
          Learn chess from beginner to master
        </h1>
        <p className="mt-2 max-w-2xl text-white/90">
          A free, open-source curriculum. Every lesson covers one topic with an
          article, puzzles that drill the idea, grandmaster games that show it in
          action, and a built-in engine for checking your analysis.
        </p>
        <p className="mt-3 text-sm text-white/80">
          {completedLessons.length} of {totalLessons} lessons complete
        </p>
      </section>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Skill categories</h2>
        <button
          onClick={toggleAll}
          className="text-sm font-medium text-brand hover:underline"
        >
          {allOpen ? 'Collapse all' : 'Expand all'}
        </button>
      </div>

      <div className="space-y-3">
        {curriculum.map((category) => {
          const isOpen = open.has(category.id)
          const done = category.lessons.filter((l) =>
            isLessonComplete(l.slug),
          ).length
          const pct = category.lessons.length
            ? Math.round((done / category.lessons.length) * 100)
            : 0

          return (
            <section
              key={category.id}
              className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
            >
              <h3>
                <button
                  onClick={() => toggle(category.id)}
                  aria-expanded={isOpen}
                  aria-controls={`lessons-${category.id}`}
                  className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                >
                  <span
                    className={`shrink-0 text-neutral-400 transition-transform ${
                      isOpen ? 'rotate-90' : ''
                    }`}
                    aria-hidden
                  >
                    ▶
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{category.name}</span>
                    <span className="mt-0.5 block text-sm text-neutral-500">
                      {category.description}
                    </span>
                  </span>

                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm tabular-nums text-neutral-500">
                      {done} / {category.lessons.length}
                    </span>
                    <span className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                      <span
                        className="block h-full bg-brand transition-[width] duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </span>
                  </span>
                </button>
              </h3>

              {isOpen && (
                <ul
                  id={`lessons-${category.id}`}
                  className="border-t border-neutral-200 dark:border-neutral-800"
                >
                  {category.lessons.map((lesson) => {
                    const complete = isLessonComplete(lesson.slug)
                    const puzzles = lesson.puzzleIds?.length ?? 0
                    return (
                      <li
                        key={lesson.slug}
                        className="border-b border-neutral-100 last:border-b-0 dark:border-neutral-800/60"
                      >
                        <Link
                          to={`/lesson/${lesson.slug}`}
                          className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                        >
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
                              complete
                                ? 'bg-brand text-white'
                                : 'border border-neutral-300 text-transparent dark:border-neutral-600'
                            }`}
                            aria-hidden
                          >
                            ✓
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium leading-snug">
                              {lesson.title}
                            </span>
                            <span className="block truncate text-xs text-neutral-500">
                              {lesson.summary}
                            </span>
                          </span>
                          {puzzles > 0 && (
                            <span className="shrink-0 rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500 dark:bg-neutral-800">
                              {puzzles} puzzle{puzzles > 1 ? 's' : ''}
                            </span>
                          )}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
