import type { CurriculumModule, Lesson } from '../types'
import { getAllLessons } from './lessons'

/**
 * Module groups, in curriculum order. These mirror the "78-module
 * beginner-to-master sequence" in comprehensive_chess_curriculum.md. Each
 * lesson's frontmatter `module` field must match one of these `name`s.
 */
export const MODULE_DEFINITIONS: Omit<CurriculumModule, 'lessons'>[] = [
  {
    id: 'beginner',
    name: 'Beginner pathway',
    stage: 'Stage A–C · Unrated–1200',
    description:
      'Learn the board, rules, notation, basic mates, piece safety, and how to finish a legal game. Foundations for everything that follows.',
  },
  {
    id: 'tactics',
    name: 'Tactical and technical foundations',
    stage: 'Modules 1–10 · ~1200–1500',
    description:
      'Board safety and the core tactical families: forks, pins, skewers, discoveries, deflection, mating patterns, and defensive tactics.',
  },
  {
    id: 'calculation',
    name: 'Calculation and attacking play',
    stage: 'Modules 11–20 · ~1400–1700',
    description:
      'Generate candidates, calculate forcing lines, visualize, and run principled attacks against castled and uncastled kings.',
  },
  {
    id: 'positional',
    name: 'Positional chess',
    stage: 'Modules 21–30 · ~1500–1900',
    description:
      'Evaluate positions, use pawn structure and piece activity, apply prophylaxis, and convert advantages with the two-weakness method.',
  },
  {
    id: 'structures',
    name: 'Pawn structures and openings',
    stage: 'Modules 31–40 · ~1700–2000',
    description:
      'Master the recurring pawn structures (IQP, hanging pawns, Carlsbad, Maroczy, and more) and build a coherent repertoire.',
  },
  {
    id: 'endgames',
    name: 'Endgames',
    stage: 'Modules 41–50 · all levels',
    description:
      'Fundamental mates, king-and-pawn theory, and the essential rook, minor-piece, and queen endings, from Lucena to Vancura.',
  },
  {
    id: 'mastery',
    name: 'Competitive mastery',
    stage: 'Modules 51–60 · 1900+',
    description:
      'Independent game analysis, error taxonomy, defense, opponent preparation, tournament psychology, and the individual master cycle.',
  },
]

/**
 * Build the curriculum by grouping loaded lessons under their module. Modules
 * appear in MODULE_DEFINITIONS order; lessons within a module are sorted by
 * their global `order`.
 */
export function getCurriculum(): CurriculumModule[] {
  const lessons = getAllLessons()
  const byModule = new Map<string, Lesson[]>()
  for (const lesson of lessons) {
    const list = byModule.get(lesson.module) ?? []
    list.push(lesson)
    byModule.set(lesson.module, list)
  }

  return MODULE_DEFINITIONS.map((def) => ({
    ...def,
    lessons: (byModule.get(def.name) ?? []).sort((a, b) => a.order - b.order),
  }))
}
