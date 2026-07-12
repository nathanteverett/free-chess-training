import { describe, it, expect } from 'vitest'
import { Chess } from 'chess.js'
import { puzzles } from './index'

// Guards against typos in seed puzzle data: every solution move must be legal
// from the position it is played in, and mate puzzles must actually end in mate.
describe('seed puzzles', () => {
  for (const puzzle of puzzles) {
    it(`${puzzle.id}: solution line is fully legal`, () => {
      const game = new Chess(puzzle.fen)
      for (const uci of puzzle.solution) {
        const move = game.move({
          from: uci.slice(0, 2),
          to: uci.slice(2, 4),
          promotion: uci.length > 4 ? uci[4] : undefined,
        })
        expect(move, `illegal move ${uci} in ${puzzle.id}`).toBeTruthy()
      }
    })

    it(`${puzzle.id}: has at least one hint and an idea`, () => {
      expect(puzzle.hints.length).toBeGreaterThan(0)
      expect(puzzle.idea.length).toBeGreaterThan(0)
    })

    if (puzzle.theme === 'backRank') {
      it(`${puzzle.id}: ends in checkmate`, () => {
        const game = new Chess(puzzle.fen)
        for (const uci of puzzle.solution) {
          game.move({
            from: uci.slice(0, 2),
            to: uci.slice(2, 4),
            promotion: uci.length > 4 ? uci[4] : undefined,
          })
        }
        expect(game.isCheckmate()).toBe(true)
      })
    }
  }
})
