import { Link } from 'react-router-dom'
import { getCurriculum } from '../content/curriculum'
import { useProgress } from '../progress/ProgressContext'

export function Home() {
  const curriculum = getCurriculum()
  const { isLessonComplete, completedLessons } = useProgress()
  const totalLessons = curriculum.reduce((n, m) => n + m.lessons.length, 0)

  return (
    <div className="space-y-8">
      <section className="rounded-xl bg-gradient-to-br from-brand to-brand-dark p-6 text-white">
        <h1 className="text-2xl font-bold sm:text-3xl">
          Learn chess from beginner to master
        </h1>
        <p className="mt-2 max-w-2xl text-white/90">
          A free, open-source curriculum. Every lesson pairs an article and a
          video with puzzles that drill the idea, grandmaster games that show it
          in action, and a built-in engine for checking your analysis.
        </p>
        <p className="mt-3 text-sm text-white/80">
          {completedLessons.length} of {totalLessons} lessons complete
        </p>
      </section>

      {curriculum.map((module) => {
        const done = module.lessons.filter((l) => isLessonComplete(l.slug)).length
        return (
          <section key={module.id}>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold">{module.name}</h2>
                <p className="text-sm text-neutral-500">{module.stage}</p>
              </div>
              <span className="text-sm text-neutral-500">
                {done} / {module.lessons.length} done
              </span>
            </div>
            <p className="mb-3 max-w-3xl text-sm text-neutral-600 dark:text-neutral-400">
              {module.description}
            </p>

            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {module.lessons.map((lesson) => {
                const complete = isLessonComplete(lesson.slug)
                return (
                  <li key={lesson.slug}>
                    <Link
                      to={`/lesson/${lesson.slug}`}
                      className="flex h-full items-start gap-2 rounded-lg border border-neutral-200 bg-white p-3 transition hover:border-brand hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
                          complete
                            ? 'bg-brand text-white'
                            : 'border border-neutral-300 text-transparent dark:border-neutral-600'
                        }`}
                        aria-hidden
                      >
                        ✓
                      </span>
                      <span>
                        <span className="block text-sm font-medium leading-snug">
                          {lesson.title}
                        </span>
                        {(lesson.puzzleIds?.length ?? 0) > 0 && (
                          <span className="mt-1 inline-block text-xs text-neutral-500">
                            {lesson.puzzleIds!.length} puzzle
                            {lesson.puzzleIds!.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
