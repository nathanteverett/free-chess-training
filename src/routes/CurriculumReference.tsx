import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
// The full curriculum document lives at the repo root and is imported as raw
// text so it stays a single source of truth (the same file feeds lesson
// generation via scripts/generate-lessons.mjs).
import curriculumMd from '../../comprehensive_chess_curriculum.md?raw'

export function CurriculumReference() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Full curriculum reference</h1>
      <p className="mt-1 text-sm text-neutral-500">
        The complete beginner-to-master curriculum this app’s lessons are built
        from. Use it as the master syllabus; the lesson pages break it into
        practice.
      </p>
      <div className="prose-lesson mt-6 max-w-none overflow-x-auto">
        <Markdown remarkPlugins={[remarkGfm]}>{curriculumMd}</Markdown>
      </div>
    </div>
  )
}
