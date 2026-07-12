// Shared domain types for the chess curriculum app.
import type { ComponentType } from 'react'

/** A link to an annotated grandmaster game illustrating a lesson's idea. */
export interface GameLink {
  /** Human-readable label, e.g. "Kasparov vs Topalov, 1999". */
  label: string
  /** URL to the game (Lichess study, chessgames.com, etc.). */
  url: string
  /** Optional one-line note on why the game is relevant. */
  note?: string
}

/**
 * Frontmatter authored at the top of each lesson `.mdx` file. The MDX body
 * (everything below the frontmatter) is the article itself.
 */
export interface LessonFrontmatter {
  /** URL slug, unique across all lessons, e.g. "b12-forks-pins-skewers". */
  slug: string
  /** Lesson title shown in nav and headings. */
  title: string
  /** Name of the module group this lesson belongs to (see curriculum.ts). */
  module: string
  /** Rating/stage band label, e.g. "Stage A", "Stage 2". */
  stage: string
  /** Global ordering index used to sequence the whole curriculum. */
  order: number
  /** One-sentence summary shown on cards and previews. */
  summary: string
  /** YouTube video ID (the part after `v=`); empty until provided. */
  youtubeId?: string
  /** IDs of puzzles (see puzzles/*) that practice this lesson. */
  puzzleIds?: string[]
  /** Grandmaster games that demonstrate the lesson's idea. */
  games?: GameLink[]
}

/** A lesson is its frontmatter plus the rendered MDX article component. */
export interface Lesson extends LessonFrontmatter {
  /** The MDX article body as a React component. */
  Article: ComponentType<Record<string, unknown>>
}

/** A module groups a set of lessons under a stage band. */
export interface CurriculumModule {
  /** Stable id/key. */
  id: string
  /** Display name, e.g. "Beginner pathway". */
  name: string
  /** Rating band label, e.g. "Stage A–C · Unrated–1200". */
  stage: string
  /** Short description of what the module covers. */
  description: string
  /** Lessons in this module, sorted by order. */
  lessons: Lesson[]
}

/**
 * A training puzzle. The solution is the full correct line in UCI long
 * algebraic notation (e.g. "e2e4", "e7e8q"). The side to move plays the
 * odd-indexed moves; even indices are the forced opponent replies.
 */
export interface Puzzle {
  /** Unique id referenced from lesson frontmatter. */
  id: string
  /** Starting position in Forsyth–Edwards Notation. */
  fen: string
  /**
   * Correct line as UCI moves, alternating solver/opponent starting with the
   * solver. The puzzle is solved when all solver moves are played.
   */
  solution: string[]
  /** Tactical theme, e.g. "fork", "pin", "backRank". */
  theme: string
  /** Short explanation of the key idea, revealed on solve. */
  idea: string
  /**
   * Progressive hints, revealed one at a time. Order from most general
   * (where to look) to most specific (the first move).
   */
  hints: string[]
  /** Optional attribution, e.g. "Lichess puzzle 00sHx (CC0)". */
  source?: string
}

/** Engine evaluation of a position, as parsed from Stockfish UCI output. */
export interface EngineEval {
  /** Depth reached. */
  depth: number
  /** Score in centipawns from White's perspective (mate encoded separately). */
  scoreCp: number | null
  /** Moves-to-mate from side-to-move's perspective, if a mate is seen. */
  mateIn: number | null
  /** Best move in UCI notation. */
  bestMove: string | null
  /** Principal variation (best line) in UCI notation. */
  pv: string[]
}
