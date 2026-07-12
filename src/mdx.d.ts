// Type declarations for MDX lesson modules loaded via import.meta.glob.
// Each lesson exports a default React component (the article body) and a
// `frontmatter` object produced by remark-mdx-frontmatter.
declare module '*.mdx' {
  import type { ComponentType } from 'react'
  import type { LessonFrontmatter } from './types'

  export const frontmatter: LessonFrontmatter
  const MDXComponent: ComponentType<Record<string, unknown>>
  export default MDXComponent
}
