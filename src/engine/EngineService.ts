import type { EngineEval } from '../types'

// Path to the single-threaded Stockfish worker script served from /public.
// The single build needs no COOP/COEP headers (see scripts/copy-engine.mjs).
// BASE_URL (always trailing-slashed) keeps this correct when the site is served
// from a subpath, as it is on GitHub project pages.
const ENGINE_URL = `${import.meta.env.BASE_URL}stockfish/stockfish-nnue-16-single.js`

export interface AnalyzeOptions {
  /** Search depth. Higher is stronger but slower. */
  depth?: number
  /** Number of best lines to request (UCI MultiPV). */
  multiPv?: number
}

type UpdateListener = (evalResult: EngineEval) => void

/**
 * Thin wrapper around a Stockfish Web Worker that speaks UCI. Exposes a
 * promise-based `analyze()` that also streams intermediate evaluations, so the
 * UI can show a live eval bar and best line while the search deepens.
 */
export class EngineService {
  private worker: Worker | null = null
  private ready: Promise<void>
  private currentResolve: ((e: EngineEval) => void) | null = null
  private currentUpdate: UpdateListener | null = null
  private latest: EngineEval = emptyEval()
  private whiteToMove = true

  constructor() {
    this.ready = this.init()
  }

  private init(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.worker = new Worker(ENGINE_URL)
      } catch (err) {
        reject(err)
        return
      }
      this.worker.onmessage = (e: MessageEvent) => this.onLine(lineOf(e))
      this.worker.onerror = (e) => {
        // Surface a clear error if the engine fails to boot.
        console.error('[engine] worker error', e.message)
      }
      const onReady = (e: MessageEvent) => {
        if (lineOf(e).includes('uciok')) {
          this.worker?.removeEventListener('message', onReady)
          resolve()
        }
      }
      this.worker.addEventListener('message', onReady)
      this.send('uci')
    })
  }

  private send(cmd: string) {
    this.worker?.postMessage(cmd)
  }

  private onLine(line: string) {
    if (line.startsWith('info')) {
      const parsed = parseInfo(line, this.whiteToMove)
      if (parsed) {
        this.latest = { ...this.latest, ...parsed }
        this.currentUpdate?.(this.latest)
      }
    } else if (line.startsWith('bestmove')) {
      const best = line.split(/\s+/)[1]
      this.latest = {
        ...this.latest,
        bestMove: best && best !== '(none)' ? best : this.latest.bestMove,
      }
      const resolve = this.currentResolve
      this.currentResolve = null
      this.currentUpdate = null
      resolve?.(this.latest)
    }
  }

  /**
   * Analyze a position. Cancels any in-flight search. Resolves with the final
   * evaluation once the engine reports `bestmove`. `onUpdate` fires on every
   * intermediate depth so the UI can update live.
   */
  async analyze(
    fen: string,
    options: AnalyzeOptions = {},
    onUpdate?: UpdateListener,
  ): Promise<EngineEval> {
    await this.ready
    const { depth = 16, multiPv = 1 } = options

    // Cancel a prior search so a stale bestmove can't resolve the new promise.
    if (this.currentResolve) {
      this.send('stop')
      this.currentResolve = null
    }

    this.whiteToMove = fenSideToMove(fen) === 'w'
    this.latest = emptyEval()
    this.currentUpdate = onUpdate ?? null

    return new Promise<EngineEval>((resolve) => {
      this.currentResolve = resolve
      this.send(`setoption name MultiPV value ${multiPv}`)
      this.send(`position fen ${fen}`)
      this.send(`go depth ${depth}`)
    })
  }

  /** Stop the current search without resolving with a new position. */
  stop() {
    this.send('stop')
  }

  dispose() {
    this.send('quit')
    this.worker?.terminate()
    this.worker = null
  }
}

function emptyEval(): EngineEval {
  return { depth: 0, scoreCp: null, mateIn: null, bestMove: null, pv: [] }
}

/** Reads a text line out of a worker message (builds vary: string or {data}). */
function lineOf(e: MessageEvent): string {
  const d = e.data
  if (typeof d === 'string') return d
  if (d && typeof d.data === 'string') return d.data
  return String(d)
}

function fenSideToMove(fen: string): 'w' | 'b' {
  return fen.split(/\s+/)[1] === 'b' ? 'b' : 'w'
}

/**
 * Parse a UCI `info` line into a partial EngineEval. Scores are converted from
 * the engine's side-to-move perspective to White's perspective so the eval bar
 * is consistent regardless of whose move it is.
 */
function parseInfo(
  line: string,
  whiteToMove: boolean,
): Partial<EngineEval> | null {
  const tokens = line.split(/\s+/)
  const result: Partial<EngineEval> = {}
  let sawScore = false

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    if (t === 'depth') {
      result.depth = Number(tokens[i + 1])
    } else if (t === 'score') {
      const kind = tokens[i + 1]
      const value = Number(tokens[i + 2])
      const sign = whiteToMove ? 1 : -1
      if (kind === 'cp') {
        result.scoreCp = sign * value
        result.mateIn = null
        sawScore = true
      } else if (kind === 'mate') {
        result.mateIn = sign * value
        result.scoreCp = null
        sawScore = true
      }
    } else if (t === 'pv') {
      const pv = tokens.slice(i + 1)
      result.pv = pv
      result.bestMove = pv[0] ?? null
      break
    }
  }

  // Ignore lines that carry no score/pv signal (e.g. `info string ...`).
  if (!sawScore && !result.pv) return null
  return result
}
