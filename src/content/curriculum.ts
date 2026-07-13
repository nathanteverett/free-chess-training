import type { SkillCategory, Lesson } from '../types'
import { getAllLessons } from './lessons'

/**
 * The skill categories lessons are filed under, in curriculum order. Each
 * lesson's frontmatter `category` field must match one of these `id`s.
 *
 * These are a subject grouping, not a rating ladder: categories deliberately
 * carry no stage/rating band. A lesson is filed by the skill it builds.
 */
export const CATEGORY_DEFINITIONS: Omit<SkillCategory, 'lessons'>[] = [
  {
    id: 'fundamentals',
    name: 'Fundamentals',
    description:
      'The board, the rules, notation, and how to finish a legal game. Everything else assumes these.',
  },
  {
    id: 'tactics',
    name: 'Tactics',
    description:
      'The forcing patterns that win material and deliver mate: forks, pins, skewers, discoveries, deflection, and the mating nets.',
  },
  {
    id: 'calculation',
    name: 'Calculation and attack',
    description:
      'Generate candidate moves, calculate forcing lines accurately, visualize ahead, and run principled attacks on the king.',
  },
  {
    id: 'positional',
    name: 'Positional play',
    description:
      'Evaluate a position, exploit pawn structure and piece activity, restrain your opponent, and convert an advantage.',
  },
  {
    id: 'structures',
    name: 'Pawn structures and openings',
    description:
      'The recurring pawn skeletons — IQP, hanging pawns, Carlsbad, Maroczy, and the rest — and how to build a repertoire around them.',
  },
  {
    id: 'endgames',
    name: 'Endgames',
    description:
      'Fundamental mates, king-and-pawn theory, and the essential rook, minor-piece, and queen endings, from Lucena to Vancura.',
  },
  {
    id: 'mastery',
    name: 'Competitive mastery',
    description:
      'Analyze your own games, manage the clock, defend, prepare for opponents, and train like a competitor.',
  },
]

/**
 * Build the curriculum by grouping loaded lessons under their category.
 * Categories appear in CATEGORY_DEFINITIONS order; lessons within a category are
 * sorted by their global `order`.
 */
export function getCurriculum(): SkillCategory[] {
  const lessons = getAllLessons()
  const byCategory = new Map<string, Lesson[]>()
  for (const lesson of lessons) {
    const list = byCategory.get(lesson.category) ?? []
    list.push(lesson)
    byCategory.set(lesson.category, list)
  }

  return CATEGORY_DEFINITIONS.map((def) => ({
    ...def,
    lessons: (byCategory.get(def.id) ?? []).sort((a, b) => a.order - b.order),
  }))
}

/** Look up a category definition by id. */
export function getCategory(
  id: string,
): Omit<SkillCategory, 'lessons'> | undefined {
  return CATEGORY_DEFINITIONS.find((c) => c.id === id)
}
