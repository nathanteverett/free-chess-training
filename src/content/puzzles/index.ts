import type { Lesson, Puzzle } from '../../types'
import { generatedPuzzles } from './generated'

// Curated seed puzzles, hand-written and referenced by id from a lesson's
// `puzzleIds` frontmatter. Everything else comes from generated.ts, which
// `npm run import-puzzles` fills from the Lichess open puzzle database (CC0);
// see docs/authoring-lessons.md.
//
// Solutions are UCI moves alternating solver/opponent, starting with the solver.
export const puzzles: Puzzle[] = [
  {
    id: 'backrank-mate-1',
    fen: '6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1',
    solution: ['e1e8'],
    theme: 'backRank',
    idea: 'The black king is trapped behind its own f7-g7-h7 pawns. The rook slides to the open back rank and delivers checkmate — there is no escape square and nothing can block or capture.',
    hints: [
      'Look at the black king’s escape squares. Where can it go?',
      'The f7, g7, and h7 pawns box the king in on the back rank.',
      'Bring your rook to the 8th rank with check.',
    ],
    source: 'Curated example (back-rank mate)',
  },
  {
    id: 'knight-fork-queen',
    fen: '3q3k/8/8/6N1/8/8/8/6K1 w - - 0 1',
    solution: ['g5f7', 'h8g8', 'f7d8'],
    theme: 'fork',
    idea: 'The knight jumps to f7 with check (a "family fork" square), attacking the king on h8 and the queen on d8 at once. After the king steps aside, the knight captures the queen.',
    hints: [
      'Your knight can reach a square that attacks two black pieces at once.',
      'Find a knight move that gives check AND hits the queen.',
      'Play Nf7+ — it forks the king and the queen.',
    ],
    source: 'Curated example (knight fork)',
  },
  {
    id: 'queen-double-attack',
    fen: '6k1/1r6/8/8/8/8/8/3Q2K1 w - - 0 1',
    solution: ['d1d5', 'g8f8', 'd5b7'],
    theme: 'double-attack',
    idea: 'The queen goes to d5, checking the king along the a8–h1 diagonal while simultaneously eyeing the undefended rook on b7. The king must respond to the check, and then the queen wins the rook.',
    hints: [
      'The black rook on b7 is undefended. Can you attack it while doing something else?',
      'Find a queen move that gives check and attacks the rook on the same turn.',
      'Play Qd5+ — check plus an attack on b7.',
    ],
    source: 'Curated example (queen double attack)',
  },
]

const imported = Object.values(generatedPuzzles).flat()

/** Every puzzle the site knows about: curated seeds plus the imported pool. */
export const allPuzzles: Puzzle[] = [...puzzles, ...imported]

const byId = new Map(allPuzzles.map((p) => [p.id, p]))

/** Look up a puzzle by id; undefined if not found. */
export function getPuzzle(id: string): Puzzle | undefined {
  return byId.get(id)
}

/** Resolve a list of puzzle ids to puzzles, skipping any unknown ids. */
export function getPuzzles(ids: string[] | undefined): Puzzle[] {
  if (!ids) return []
  return ids.map((id) => byId.get(id)).filter((p): p is Puzzle => Boolean(p))
}

/**
 * Puzzles for a lesson: any hand-picked ones from its `puzzleIds` frontmatter
 * first, then the imported puzzles matched to that lesson's slug.
 */
export function getLessonPuzzles(
  lesson: Pick<Lesson, 'slug' | 'puzzleIds'>,
): Puzzle[] {
  const authored = getPuzzles(lesson.puzzleIds)
  const authoredIds = new Set(authored.map((p) => p.id))
  const generated = (generatedPuzzles[lesson.slug] ?? []).filter((p) => !authoredIds.has(p.id))
  return [...authored, ...generated]
}
