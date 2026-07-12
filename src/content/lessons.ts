import type { Lesson, LessonFrontmatter } from '../types'

// Eagerly load every lesson MDX module at build time. Each module exposes a
// `frontmatter` export (from remark-mdx-frontmatter) and a default component
// (the article body).
interface LessonModule {
  frontmatter: LessonFrontmatter
  default: React.ComponentType<Record<string, unknown>>
}

const modules = import.meta.glob<LessonModule>('./lessons/*.mdx', {
  eager: true,
})

const allLessons: Lesson[] = Object.values(modules)
  .map((m) => ({ ...m.frontmatter, Article: m.default }))
  .sort((a, b) => a.order - b.order)

const bySlug = new Map(allLessons.map((l) => [l.slug, l]))

/** All lessons in curriculum order. */
export function getAllLessons(): Lesson[] {
  return allLessons
}

/** Look up a single lesson by slug. */
export function getLesson(slug: string): Lesson | undefined {
  return bySlug.get(slug)
}

/** The lesson immediately before/after a given slug in curriculum order. */
export function getAdjacentLessons(slug: string): {
  prev: Lesson | undefined
  next: Lesson | undefined
} {
  const idx = allLessons.findIndex((l) => l.slug === slug)
  if (idx === -1) return { prev: undefined, next: undefined }
  return {
    prev: idx > 0 ? allLessons[idx - 1] : undefined,
    next: idx < allLessons.length - 1 ? allLessons[idx + 1] : undefined,
  }
}
