// Validates every lesson MDX file. Run with `npm run check-lessons`.
//
// The build already catches MDX that fails to compile, but by then the error is
// a stack trace pointing at a line number. These checks name the actual problem
// — a placeholder that was never filled in, an unbalanced <Silent>, a stray
// brace that MDX would read as JavaScript — and check all files in one pass.
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const lessonDir = join(root, 'src', 'content', 'lessons')

/** Minimum article length. Anything shorter is a stub, not a lesson. */
const MIN_WORDS = 400

const problems = []
const files = readdirSync(lessonDir).filter((f) => f.endsWith('.mdx'))

for (const file of files) {
  const slug = file.replace(/\.mdx$/, '')
  const raw = readFileSync(join(lessonDir, file), 'utf8')
  const fail = (message) => problems.push(`${file}: ${message}`)

  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) {
    fail('no frontmatter block')
    continue
  }
  const [, frontmatter, body] = match

  for (const field of ['slug', 'title', 'category', 'order', 'summary']) {
    if (!new RegExp(`^${field}:`, 'm').test(frontmatter)) {
      fail(`frontmatter is missing \`${field}\``)
    }
  }
  if (!new RegExp(`^slug: ${slug}\\s*$`, 'm').test(frontmatter)) {
    fail(`frontmatter slug does not match the filename (${slug})`)
  }

  if (/Starter outline/.test(body)) fail('still contains the generated stub')

  const words = body.split(/\s+/).filter(Boolean).length
  if (words < MIN_WORDS) fail(`article is only ${words} words (min ${MIN_WORDS})`)

  if (!/^## Overview\s*$/m.test(body)) fail('has no "## Overview" section')
  if (!/^## Practice\s*$/m.test(body)) fail('has no "## Practice" section')
  if (/^# /m.test(body)) fail('uses a level-1 heading (the page supplies the h1)')

  // MDX reads a bare brace as a JS expression and a bare `<` as a JSX tag, so
  // either one in prose fails the build.
  if (/[{}]/.test(body)) fail('contains a curly brace, which MDX parses as JavaScript')

  const tags = body.match(/<\/?[A-Za-z][^>]*>/g) ?? []
  const stripped = body.replace(/<\/?[A-Za-z][^>]*>/g, '')
  if (/[<>]/.test(stripped)) fail('contains a bare < or > in prose')

  for (const tag of tags) {
    const name = tag.match(/^<\/?([A-Za-z]+)/)[1]
    if (name !== 'Spoken' && name !== 'Silent') {
      fail(`uses unknown component <${name}> (only Spoken and Silent exist)`)
    }
  }
  for (const name of ['Spoken', 'Silent']) {
    const open = (body.match(new RegExp(`<${name}>`, 'g')) ?? []).length
    const close = (body.match(new RegExp(`</${name}>`, 'g')) ?? []).length
    if (open !== close) fail(`unbalanced <${name}>: ${open} open, ${close} closed`)
  }

  // A <Silent> block that is never paired with spoken wording leaves listeners
  // with a hole in the lesson.
  if (/<Silent>/.test(body) && !/<Spoken>/.test(body)) {
    fail('has a <Silent> block but no <Spoken> line to narrate it')
  }
}

if (problems.length > 0) {
  console.error(`${problems.length} problem(s) in ${files.length} lessons:\n`)
  for (const problem of problems) console.error(`  ${problem}`)
  process.exit(1)
}

console.log(`${files.length} lessons OK`)
