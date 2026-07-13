// A small wrapper around the browser's SpeechSynthesis API.
//
// Everything here is free and offline: no API key, no audio files, no network.
// The tradeoff is that the API is quirky, and most of this file is the quirks.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type SpeechStatus = 'idle' | 'playing' | 'paused'

export interface SpeechState {
  supported: boolean
  status: SpeechStatus
  /** Index of the chunk currently being spoken. */
  index: number
  /** Total chunks in the queue. */
  total: number
  voices: SpeechSynthesisVoice[]
  voiceURI: string | null
  rate: number
  play: (from?: number) => void
  pause: () => void
  resume: () => void
  stop: () => void
  setVoiceURI: (uri: string) => void
  setRate: (rate: number) => void
}

const RATE_KEY = 'fct:tts:rate'
const VOICE_KEY = 'fct:tts:voice'

const readStored = (key: string): string | null => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const store = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Private mode or blocked storage: the setting just won't persist.
  }
}

/**
 * Drives a queue of text chunks through the speech synthesizer.
 *
 * Chunks are spoken one utterance at a time rather than as a single long one:
 * browsers truncate long utterances, and one utterance per chunk is what gives
 * us a position to report, pause at, and resume from.
 */
export function useSpeech(chunks: string[]): SpeechState {
  const supported =
    typeof window !== 'undefined' && 'speechSynthesis' in window

  const [status, setStatus] = useState<SpeechStatus>('idle')
  const [index, setIndex] = useState(0)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [voiceURI, setVoiceURIState] = useState<string | null>(() =>
    readStored(VOICE_KEY),
  )
  const [rate, setRateState] = useState<number>(() => {
    const stored = Number(readStored(RATE_KEY))
    return stored >= 0.5 && stored <= 2 ? stored : 1
  })

  // The queue advances inside utterance callbacks, which close over whatever
  // was current when the utterance was created. Refs keep them looking at the
  // live values instead.
  const chunksRef = useRef(chunks)
  const rateRef = useRef(rate)
  const voiceRef = useRef(voiceURI)
  const cancelledRef = useRef(false)
  chunksRef.current = chunks
  rateRef.current = rate
  voiceRef.current = voiceURI

  // Voices load asynchronously in Chrome: the first call returns an empty array
  // and the real list arrives on `voiceschanged`.
  useEffect(() => {
    if (!supported) return
    const load = () => setVoices(window.speechSynthesis.getVoices())
    load()
    window.speechSynthesis.addEventListener('voiceschanged', load)
    return () =>
      window.speechSynthesis.removeEventListener('voiceschanged', load)
  }, [supported])

  const selectedVoice = useMemo(
    () => voices.find((v) => v.voiceURI === voiceURI) ?? null,
    [voices, voiceURI],
  )

  const speakFrom = useCallback(
    (start: number) => {
      if (!supported) return
      const queue = chunksRef.current
      if (start >= queue.length) {
        setStatus('idle')
        setIndex(0)
        return
      }

      const utterance = new SpeechSynthesisUtterance(queue[start])
      utterance.rate = rateRef.current
      const voice = window.speechSynthesis
        .getVoices()
        .find((v) => v.voiceURI === voiceRef.current)
      if (voice) {
        utterance.voice = voice
        utterance.lang = voice.lang
      }

      utterance.onend = () => {
        // `cancel()` fires `onend` on the utterance it killed. Without this
        // guard, stopping would immediately start the next chunk.
        if (cancelledRef.current) return
        setIndex(start + 1)
        speakFrom(start + 1)
      }
      utterance.onerror = () => {
        if (cancelledRef.current) return
        setStatus('idle')
      }

      cancelledRef.current = false
      setIndex(start)
      setStatus('playing')
      window.speechSynthesis.speak(utterance)
    },
    [supported],
  )

  const stop = useCallback(() => {
    if (!supported) return
    cancelledRef.current = true
    window.speechSynthesis.cancel()
    setStatus('idle')
    setIndex(0)
  }, [supported])

  const play = useCallback(
    (from?: number) => {
      if (!supported) return
      cancelledRef.current = true
      window.speechSynthesis.cancel()
      speakFrom(from ?? 0)
    },
    [supported, speakFrom],
  )

  const pause = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.pause()
    setStatus('paused')
  }, [supported])

  const resume = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.resume()
    setStatus('playing')
  }, [supported])

  // Chrome stops speaking after ~15 seconds unless it is periodically nudged.
  // The pause/resume pair is a no-op to the listener but resets that timer.
  useEffect(() => {
    if (!supported || status !== 'playing') return
    const id = window.setInterval(() => {
      window.speechSynthesis.pause()
      window.speechSynthesis.resume()
    }, 10_000)
    return () => window.clearInterval(id)
  }, [supported, status])

  // Speech is global to the page, not to the component: leaving the lesson (or
  // hot-reloading it) has to silence it, or it keeps reading the old article.
  useEffect(() => {
    return () => {
      if (!supported) return
      cancelledRef.current = true
      window.speechSynthesis.cancel()
    }
  }, [supported])

  // Changing voice or speed mid-sentence: restart the current chunk with the
  // new setting rather than waiting for the next one.
  const setRate = useCallback(
    (next: number) => {
      setRateState(next)
      rateRef.current = next
      store(RATE_KEY, String(next))
      if (status !== 'idle') play(index)
    },
    [status, index, play],
  )

  const setVoiceURI = useCallback(
    (uri: string) => {
      setVoiceURIState(uri)
      voiceRef.current = uri
      store(VOICE_KEY, uri)
      if (status !== 'idle') play(index)
    },
    [status, index, play],
  )

  return {
    supported,
    status,
    index,
    total: chunks.length,
    voices,
    voiceURI: selectedVoice?.voiceURI ?? voiceURI,
    rate,
    play,
    pause,
    resume,
    stop,
    setVoiceURI,
    setRate,
  }
}
