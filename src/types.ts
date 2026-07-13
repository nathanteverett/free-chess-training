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

/** One half-move in a replayable, annotated master game. */
export interface AnnotatedGameMove {
  /** Standard algebraic notation, e.g. "Nf3" or "Qb8+". */
  san: string
  /** Plain-language purpose or consequence of this move. */
  explanation: string
}

/** A complete master game that can be replayed on the analysis board. */
export interface AnnotatedGame {
  id: string
  title: string
  white: string
  black: string
  event: string
  result: string
  sourceUrl: string
  moves: AnnotatedGameMove[]
}

/**
 * Frontmatter authored at the top of each lesson `.mdx` file. The MDX body
 * (everything below the frontmatter) is the article itself.
 *
 * One lesson covers exactly one topic. Titles that used to bundle several ideas
 * ("Forks, pins, skewers, and double attacks") are split into a lesson each.
 */
export interface LessonFrontmatter {
  /** URL slug, unique across all lessons, e.g. "tactics-knight-fork". */
  slug: string
  /** Lesson title shown in nav and headings — a single topic. */
  title: string
  /** Id of the skill category this lesson belongs to (see curriculum.ts). */
  category: string
  /** Global ordering index used to sequence the whole curriculum. */
  order: number
  /** One-sentence summary shown on cards and previews. */
  summary: string
  /**
   * YouTube video ID override. Normally left empty: the lesson's video is
   * resolved from the curated library in content/videos.ts.
   */
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

/**
 * A skill category groups lessons by the skill they build. Categories carry no
 * rating/stage band — they are a subject grouping, not a progression ladder.
 */
export interface SkillCategory {
  /** Stable id/key, matched against each lesson's `category`. */
  id: string
  /** Display name, e.g. "Tactics". */
  name: string
  /** Short description of what the category covers. */
  description: string
  /** Lessons in this category, sorted by order. */
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
  /** Lichess Glicko rating, on imported puzzles. Absent on curated ones. */
  rating?: number
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
