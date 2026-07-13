import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import { getAllLessons } from '../lessons'
import { getLessonPuzzles } from '.'

describe('lesson puzzle coverage', () => {
  it('gives every lesson at least one fully legal puzzle', () => {
    const lessons = getAllLessons()
    expect(lessons).toHaveLength(181)

    for (const lesson of lessons) {
      const lessonPuzzles = getLessonPuzzles(lesson)
      expect(lessonPuzzles.length, lesson.slug).toBeGreaterThan(0)
      for (const puzzle of lessonPuzzles) {
        const game = new Chess(puzzle.fen)
        for (const uci of puzzle.solution) {
          expect(
            game.move({
              from: uci.slice(0, 2),
              to: uci.slice(2, 4),
              promotion: uci.length > 4 ? uci[4] : undefined,
            }),
            `${lesson.slug}: illegal move ${uci}`,
          ).toBeTruthy()
        }
      }
    }
  })
})
