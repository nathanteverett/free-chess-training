/**
 * Build a Lichess analysis-board URL for a position. Lichess accepts a FEN in
 * the path with spaces replaced by underscores, opening the board with a free
 * (unlimited) engine — a good "second opinion" alongside the in-app engine.
 */
export function lichessAnalysisUrl(fen: string): string {
  return `https://lichess.org/analysis/${fen.replace(/ /g, '_')}`
}
