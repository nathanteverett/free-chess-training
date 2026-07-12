import { Chess } from 'chess.js'
import type { EngineEval } from '../types'

/** Parse a UCI move string ("e2e4", "e7e8q") into chess.js move fields. */
export function parseUci(uci: string): {
  from: string
  to: string
  promotion?: string
} {
  return {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci.length > 4 ? uci[4] : undefined,
  }
}

/**
 * Convert a line of UCI moves into readable SAN, starting from `fen`. Stops
 * early if a move is illegal in the resulting position (defensive against
 * partial/garbled engine PVs). Returns at most `limit` moves.
 */
export function uciLineToSan(fen: string, uci: string[], limit = 8): string[] {
  const game = new Chess(fen)
  const san: string[] = []
  for (const move of uci.slice(0, limit)) {
    try {
      const result = game.move(parseUci(move))
      if (!result) break
      san.push(result.san)
    } catch {
      break
    }
  }
  return san
}

/**
 * Format an engine evaluation from White's perspective, e.g. "+1.35", "-0.20",
 * "M3" (White mates in 3), "-M2" (Black mates in 2).
 */
export function formatScore(e: EngineEval): string {
  if (e.mateIn !== null) {
    return e.mateIn >= 0 ? `M${e.mateIn}` : `-M${Math.abs(e.mateIn)}`
  }
  if (e.scoreCp !== null) {
    const pawns = e.scoreCp / 100
    return (pawns >= 0 ? '+' : '') + pawns.toFixed(2)
  }
  return '…'
}

/**
 * Map an evaluation to a 0–1 "White advantage" fraction for the eval bar,
 * using a smooth clamp so large-but-finite scores don't peg the bar instantly.
 */
export function whiteAdvantageFraction(e: EngineEval): number {
  if (e.mateIn !== null) return e.mateIn >= 0 ? 1 : 0
  if (e.scoreCp === null) return 0.5
  // Logistic curve; ~±6 pawns approaches the ends.
  const k = 0.0035
  return 1 / (1 + Math.exp(-k * e.scoreCp))
}
