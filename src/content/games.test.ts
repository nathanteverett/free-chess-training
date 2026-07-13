import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import { annotatedGames } from './games'

describe('annotated master games', () => {
  for (const annotated of annotatedGames) {
    it(`${annotated.id}: every annotated move is legal`, () => {
      const game = new Chess()
      for (const move of annotated.moves) {
        expect(move.explanation.length).toBeGreaterThan(10)
        expect(game.move(move.san), `illegal move ${move.san}`).toBeTruthy()
      }
    })
  }
})
