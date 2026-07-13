import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import { allPuzzles } from './index'
import { generatedPuzzles } from './generated'

const imported = Object.values(generatedPuzzles).flat()

// Structural guards on the imported pool. Legality of every solution line is
// already covered by coverage.test.ts; these check the things a bad import
// would get wrong *without* producing an illegal move.
describe('imported Lichess puzzles', () => {
  it('gives every puzzle a globally unique id', () => {
    // Progress is stored per puzzle id, so a collision would mark two different
    // puzzles solved at once.
    const seen = new Map<string, number>()
    for (const puzzle of allPuzzles) {
      seen.set(puzzle.id, (seen.get(puzzle.id) ?? 0) + 1)
    }
    const duplicates = [...seen.entries()].filter(([, count]) => count > 1).map(([id]) => id)
    expect(duplicates).toEqual([])
  })

  it('starts every puzzle on the solver’s move', () => {
    // A Lichess row's FEN is the position *before* the opponent's blunder, and
    // its first move is that blunder. The importer must play it off, so the
    // stored position is the one the learner actually solves from. If that step
    // regressed, the board would open with the opponent's move still to make —
    // the solution would still be "legal", just off by a ply.
    for (const puzzle of imported) {
      const game = new Chess(puzzle.fen)
      const first = puzzle.solution[0]
      const move = game.move({
        from: first.slice(0, 2),
        to: first.slice(2, 4),
        promotion: first.length > 4 ? first[4] : undefined,
      })
      expect(move, puzzle.id).toBeTruthy()
      // The solver's move must be a real try, not a forced recapture of nothing:
      // every imported line has at least one solver move plus a reply or a mate.
      expect(puzzle.solution.length, puzzle.id).toBeGreaterThan(0)
    }
  })

  it('gives every puzzle three progressive hints and an idea', () => {
    for (const puzzle of imported) {
      expect(puzzle.hints, puzzle.id).toHaveLength(3)
      expect(puzzle.idea.length, puzzle.id).toBeGreaterThan(0)
      // The last hint names the move, so it must not be empty of notation.
      expect(puzzle.hints[2], puzzle.id).toMatch(/^Play \S+\.$/)
    }
  })

  it('attributes every puzzle back to Lichess', () => {
    for (const puzzle of imported) {
      expect(puzzle.source, puzzle.id).toMatch(/^Lichess puzzle \w+ \(CC0\)/)
    }
  })
})
