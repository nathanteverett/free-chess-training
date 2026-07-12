import { useCallback, useEffect, useRef, useState } from 'react'
import { EngineService, type AnalyzeOptions } from './EngineService'
import type { EngineEval } from '../types'

export interface UseEngineResult {
  /** Latest (possibly intermediate) evaluation, or null before first run. */
  evaluation: EngineEval | null
  /** True while a search is running. */
  analyzing: boolean
  /** Start analyzing a FEN. Safe to call repeatedly; cancels prior searches. */
  analyze: (fen: string, options?: AnalyzeOptions) => void
  /** Stop the current search. */
  stop: () => void
}

/**
 * React hook that owns a single Stockfish worker for a component's lifetime and
 * exposes a live evaluation. The worker is created lazily on first `analyze`
 * and torn down on unmount.
 */
export function useEngine(): UseEngineResult {
  const engineRef = useRef<EngineService | null>(null)
  const [evaluation, setEvaluation] = useState<EngineEval | null>(null)
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    return () => {
      engineRef.current?.dispose()
      engineRef.current = null
    }
  }, [])

  const analyze = useCallback((fen: string, options?: AnalyzeOptions) => {
    if (!engineRef.current) {
      engineRef.current = new EngineService()
    }
    setAnalyzing(true)
    setEvaluation(null)
    engineRef.current
      .analyze(fen, options, (partial) => setEvaluation(partial))
      .then((final) => {
        setEvaluation(final)
        setAnalyzing(false)
      })
      .catch((err) => {
        console.error('[engine] analyze failed', err)
        setAnalyzing(false)
      })
  }, [])

  const stop = useCallback(() => {
    engineRef.current?.stop()
    setAnalyzing(false)
  }, [])

  return { evaluation, analyzing, analyze, stop }
}
