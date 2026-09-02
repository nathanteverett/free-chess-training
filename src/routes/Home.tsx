import { Link } from 'react-router-dom'
import { CATEGORY_ICONS, getCurriculum } from '../content/curriculum'
import { useProgress } from '../progress/ProgressContext'

const base = import.meta.env.BASE_URL

export function Home() {
  const curriculum = getCurriculum()
  const { isLessonComplete, completedLessons } = useProgress()

  const total = curriculum.reduce((n, c) => n + c.lessons.length, 0)
  const done = completedLessons.length
  const pct = total ? Math.round((done / total) * 100) : 0

  const perCategory = curriculum.map((category) => {
    const complete = category.lessons.filter((l) => isLessonComplete(l.slug))
    return { category, done: complete.length }
  })
  const inProgress = perCategory.filter(
    (c) => c.done > 0 && c.done < c.category.lessons.length,
  ).length
  const finished = perCategory.filter(
    (c) => c.category.lessons.length > 0 && c.done === c.category.lessons.length,
  ).length

  // "Continue where you left off": the first lesson, in curriculum order, that
  // isn't complete yet.
  const resume = curriculum
    .flatMap((c) => c.lessons.map((lesson) => ({ lesson, category: c })))
    .find(({ lesson }) => !isLessonComplete(lesson.slug))

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <section className="flex flex-col gap-3 rounded-xl border border-line bg-white p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold text-neutral-700">
              Curriculum progress
            </h2>
            <span className="text-xs text-neutral-500">
              {done} of {total} lessons
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-4xl font-bold tracking-tight">{pct}%</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200">
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-neutral-500">
            <span>
              <strong className="font-semibold text-ink">{done}</strong> complete
            </span>
            <span>
              <strong className="font-semibold text-ink">{inProgress}</strong> in
              progress
            </span>
            <span>
              <strong className="font-semibold text-ink">{finished}</strong> of{' '}
              {curriculum.length} categories finished
            </span>
          </div>
        </section>

        <section className="relative flex flex-col gap-2 overflow-hidden rounded-xl bg-brand p-5 text-white">
          <img
            src={`${base}pieces/white-knight.png`}
            alt=""
            className="absolute right-3.5 top-3.5 h-10 w-10 opacity-85 [image-rendering:pixelated]"
          />
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/70">
            {resume ? 'Continue where you left off' : 'Curriculum complete'}
          </span>
          {resume ? (
            <>
              <span className="text-lg font-bold tracking-tight">
                {resume.lesson.title}
              </span>
              <span className="text-xs text-white/75">
                {resume.category.name} · Lesson{' '}
                {resume.category.lessons.indexOf(resume.lesson) + 1} of{' '}
                {resume.category.lessons.length}
              </span>
              <Link
                to={`/lesson/${resume.lesson.slug}`}
                className="mt-auto self-start rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand hover:bg-[#e7ebf5]"
              >
                Resume lesson
              </Link>
            </>
          ) : (
            <span className="text-sm text-white/80">
              Every lesson is marked complete. Replay any of them from the
              categories below.
            </span>
          )}
        </section>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-base font-bold tracking-tight">Skill categories</h2>
        <span className="text-xs text-neutral-500">
          {curriculum.length} categories · beginner to master
        </span>
      </div>

      <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(min(100%,255px),1fr))]">
        {perCategory.map(({ category, done: catDone }, i) => {
          const catPct = category.lessons.length
            ? Math.round((catDone / category.lessons.length) * 100)
            : 0
          return (
            <Link
              key={category.id}
              to={`/category/${category.id}`}
              className="flex flex-col gap-2.5 rounded-xl border border-line bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#b9c3da] hover:shadow-[0_2px_8px_rgba(43,63,107,0.08)]"
              style={{
                animation: 'cardIn 0.4s cubic-bezier(0.16,1,0.3,1) both',
                animationDelay: `${i * 45}ms`,
              }}
            >
              <div className="flex items-start justify-between gap-2.5">
                <span className="flex h-9.5 w-9.5 items-center justify-center rounded-[9px] bg-[#eef1f7]">
                  <img
                    src={`${base}${CATEGORY_ICONS[category.id]}`}
                    alt=""
                    className="h-6.5 w-6.5 [image-rendering:pixelated]"
                  />
                </span>
                <span className="relative h-10 w-10">
                  <svg viewBox="0 0 40 40" className="h-10 w-10 -rotate-90">
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      fill="none"
                      stroke="#e9eaf0"
                      strokeWidth="4"
                    />
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      fill="none"
                      stroke={catPct === 100 ? '#16a34a' : '#2b3f6b'}
                      strokeWidth="4"
                      strokeLinecap="round"
                      // r=16 gives a circumference of 100.5, so the percentage
                      // maps almost 1:1 onto the dash length.
                      strokeDasharray={`${(catPct * 1.005).toFixed(1)} 100.5`}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10.5px] font-semibold text-neutral-700">
                    {catPct}%
                  </span>
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[14.5px] font-semibold tracking-tight">
                  {category.name}
                </span>
                <span className="text-xs leading-relaxed text-neutral-500 text-pretty">
                  {category.description}
                </span>
              </div>
              <span className="mt-auto text-xs text-neutral-600">
                <strong className="font-semibold">{catDone}</strong> /{' '}
                {category.lessons.length} lessons
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
