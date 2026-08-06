import type { Lesson } from '../types'

/** A curated YouTube video assigned to one lesson. */
export interface CuratedVideo {
  id: string
  title: string
  channel?: string
}

/**
 * Lesson slug to video. Intentionally empty until the replacement videos are
 * curated and approved.
 */
const LESSON_VIDEOS: Partial<Record<string, CuratedVideo>> = {}

export function getLessonVideo(lesson: Lesson): CuratedVideo | null {
  if (lesson.youtubeId) {
    return { id: lesson.youtubeId, title: lesson.title }
  }
  return LESSON_VIDEOS[lesson.slug] ?? null
}
