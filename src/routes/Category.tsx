import { Link, useParams } from 'react-router-dom'
import { CATEGORY_ICONS, getCurriculum } from '../content/curriculum'
import { useProgress } from '../progress/ProgressContext'

const base = import.meta.env.BASE_URL

/** Status pill shown against each lesson row. */
function badge(complete: boolean, next: boolean) {
  if (complete)
    return {
      label: '✓ Complete',
      className: 'bg-[#f1faf4] text-[#166534] border-[#c6ead1]',
    }
  if (next)
    return {
      label: '● In progress',
      className: 'bg-[#eef1f7] text-brand border-[#ccd5e8]',
    }
  return { label: 'Not started', className: 'bg-white text-neutral-600 border-line' }
}

export function Category() {
  const { id = '' } = useParams()
  const category = getCurriculum().find((c) => c.id === id)
  const { isLessonComplete } = useProgress()

  if (!category) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-medium">Category not found.</p>
        <Link to="/" className="mt-2 inline-block text-brand hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    )
  }

  const done = category.lessons.filter((l) => isLessonComplete(l.slug)).length

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <nav className="flex items-center gap-1.5 text-xs text-neutral-500">
        <Link to="/" className="text-brand hover:underline">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-neutral-700">{category.name}</span>
      </nav>

      <header className="flex flex-wrap items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#eef1f7]">
          <img
            src={`${base}${CATEGORY_ICONS[category.id]}`}
            alt=""
            className="h-8 w-8 [image-rendering:pixelated]"
          />
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">{category.name}</h1>
          <p className="max-w-xl text-sm text-neutral-500 text-pretty">
            {category.description}
          </p>
        </div>
        <div className="ml-auto shrink-0 text-right">
          <span className="block text-xl font-bold">
            {done}
            <span className="font-medium text-neutral-400">
              {' '}
              / {category.lessons.length}
            </span>
          </span>
          <span className="text-xs text-neutral-500">lessons complete</span>
        </div>
      </header>

      <section className="overflow-hidden rounded-xl border border-line bg-white">
        <div className="grid grid-cols-[44px_1fr_110px_24px] items-center gap-2 border-b border-line bg-neutral-50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-neutral-500 max-sm:grid-cols-[30px_1fr]">
          <span>#</span>
          <span>Lesson</span>
          <span className="max-sm:hidden">Status</span>
          <span className="max-sm:hidden" />
        </div>
        {category.lessons.map((lesson, i) => {
          const complete = isLessonComplete(lesson.slug)
          const { label, className } = badge(complete, !complete && i === done)
          return (
            <Link
              key={lesson.slug}
              to={`/lesson/${lesson.slug}`}
              className="grid grid-cols-[44px_1fr_110px_24px] items-center gap-2 border-b border-neutral-100 px-4 py-2.5 last:border-b-0 hover:bg-[#f7f8fa] max-sm:grid-cols-[30px_1fr] max-sm:gap-x-2 max-sm:gap-y-1"
            >
              <span className="text-xs tabular-nums text-neutral-400">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-sm font-medium text-pretty">
                {lesson.title}
              </span>
              <span
                className={`justify-self-start whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold max-sm:col-start-2 ${className}`}
              >
                {label}
              </span>
              <span className="text-sm text-neutral-300 max-sm:hidden">›</span>
            </Link>
          )
        })}
      </section>
    </div>
  )
}
