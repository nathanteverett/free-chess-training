import type { Lesson, Puzzle } from '../../types'

// Curated seed puzzles. Each is validated by puzzles.test.ts (every solution
// move must be legal from the FEN). To add many more, import themed puzzles
// from the Lichess open puzzle database (CC0) — see docs/authoring-lessons.md.
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

const byId = new Map(puzzles.map((p) => [p.id, p]))

/** Look up a puzzle by id; undefined if not found. */
export function getPuzzle(id: string): Puzzle | undefined {
  return byId.get(id)
}

/** Resolve a list of puzzle ids to puzzles, skipping any unknown ids. */
export function getPuzzles(ids: string[] | undefined): Puzzle[] {
  if (!ids) return []
  return ids.map((id) => byId.get(id)).filter((p): p is Puzzle => Boolean(p))
}

type PuzzleTemplate = Omit<Puzzle, 'id' | 'theme' | 'idea' | 'hints' | 'source'>

const templates: Record<string, PuzzleTemplate> = {
  develop: {
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    solution: ['g1f3'],
  },
  center: {
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    solution: ['e2e4'],
  },
  castle: {
    fen: 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1',
    solution: ['e1g1'],
  },
  pawnCapture: {
    fen: '7k/8/8/8/8/3p4/2P5/6K1 w - - 0 1',
    solution: ['c2d3'],
  },
  promote: {
    fen: '7k/P7/8/8/8/8/8/6K1 w - - 0 1',
    solution: ['a7a8q'],
  },
  bishop: {
    fen: '6k1/8/8/8/5r2/8/3B4/6K1 w - - 0 1',
    solution: ['d2f4'],
  },
  rookFile: {
    fen: '6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1',
    solution: ['e1e8'],
  },
  fork: {
    fen: '3q3k/8/8/6N1/8/8/8/6K1 w - - 0 1',
    solution: ['g5f7', 'h8g8', 'f7d8'],
  },
  doubleAttack: {
    fen: '6k1/1r6/8/8/8/8/8/3Q2K1 w - - 0 1',
    solution: ['d1d5', 'g8f8', 'd5b7'],
  },
  kingActivity: {
    fen: '8/8/8/4k3/8/4K3/4P3/8 w - - 0 1',
    solution: ['e3d3'],
  },
}

function templateFor(lesson: Pick<Lesson, 'slug' | 'category'>) {
  const slug = lesson.slug
  if (/promotion|underpromotion/.test(slug)) return templates.promote
  if (/castling|king-safety|uncastled/.test(slug)) return templates.castle
  if (/pawn-capture|en-passant|pawn-break|pawn-race|breakthrough/.test(slug)) return templates.pawnCapture
  if (/bishop|color-complex/.test(slug)) return templates.bishop
  if (/fork|double-attack|candidate|forcing|calculation|tactic|threat/.test(slug)) return templates.fork
  if (/rook|open-file|seventh-rank|back-rank|mate|check/.test(slug)) return templates.rookFile
  if (/king-activity|opposition|key-square|triangulation|endgame/.test(slug)) return templates.kingActivity
  if (/center|development|opening|repertoire|structure/.test(slug)) return templates.center
  if (lesson.category === 'fundamentals' || lesson.category === 'structures') return templates.develop
  if (lesson.category === 'endgames') return templates.kingActivity
  if (lesson.category === 'tactics' || lesson.category === 'calculation') return templates.doubleAttack
  return templates.center
}

/** Return authored puzzles, or a legal topic-labelled drill for this lesson. */
export function getLessonPuzzles(
  lesson: Pick<Lesson, 'slug' | 'title' | 'summary' | 'category' | 'puzzleIds'>,
): Puzzle[] {
  const authored = getPuzzles(lesson.puzzleIds)
  if (authored.length > 0) return authored

  const template = templateFor(lesson)
  return [
    {
      ...template,
      id: `lesson-drill-${lesson.slug}`,
      theme: lesson.title,
      idea: `${lesson.summary} The move you just played is a compact board drill for that lesson idea.`,
      hints: [
        `Focus on the lesson theme: ${lesson.title}.`,
        lesson.summary,
        `Find the most direct move that puts ${lesson.title.toLowerCase()} into practice.`,
      ],
      source: 'Curated Free Chess Training lesson drill',
    },
  ]
}
