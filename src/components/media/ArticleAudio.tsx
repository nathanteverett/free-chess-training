import { useEffect, useState, type RefObject } from 'react'
import { speechChunks } from '../../audio/extract'
import { useSpeech } from '../../audio/useSpeech'

interface ArticleAudioProps {
  /** The rendered article. Its text is what gets read aloud. */
  articleRef: RefObject<HTMLElement>
  /**
   * Changes whenever the article does (the lesson slug). Re-reads the DOM so
   * navigating between lessons narrates the new one.
   */
  articleKey: string
}

const RATES = [0.8, 1, 1.25, 1.5, 1.75]

/**
 * Reads a lesson article aloud with the browser's own speech synthesizer.
 *
 * The text comes from the rendered article, so it stays in sync with the page
 * for free — see `audio/extract.ts` for how authors mark what is spoken.
 */
export function ArticleAudio({ articleRef, articleKey }: ArticleAudioProps) {
  const [chunks, setChunks] = useState<string[]>([])
  const speech = useSpeech(chunks)
  const { stop } = speech

  useEffect(() => {
    stop()
    setChunks(articleRef.current ? speechChunks(articleRef.current) : [])
  }, [articleKey, articleRef, stop])

  if (!speech.supported) {
    return (
      <p className="text-sm text-neutral-500">
        Your browser doesn’t support speech synthesis, so this article can’t be
        read aloud.
      </p>
    )
  }

  const { status, index, total, rate, voices, voiceURI } = speech
  const spokenVoices = voices.filter((v) => v.lang.startsWith('en'))
  const progress = total > 0 ? Math.round((index / total) * 100) : 0

  const toggle = () => {
    if (status === 'playing') speech.pause()
    else if (status === 'paused') speech.resume()
    else speech.play(0)
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          disabled={total === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          aria-label={
            status === 'playing' ? 'Pause narration' : 'Listen to this article'
          }
        >
          <span aria-hidden="true">{status === 'playing' ? '❚❚' : '▶'}</span>
          {status === 'playing'
            ? 'Pause'
            : status === 'paused'
              ? 'Resume'
              : 'Listen'}
        </button>

        {status !== 'idle' && (
          <button
            type="button"
            onClick={speech.stop}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700"
          >
            Stop
          </button>
        )}

        <label className="ml-auto flex items-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-400">
          Speed
          <select
            value={rate}
            onChange={(e) => speech.setRate(Number(e.target.value))}
            className="rounded-md border border-neutral-300 bg-transparent px-1.5 py-1 text-sm dark:border-neutral-700"
          >
            {RATES.map((r) => (
              <option key={r} value={r}>
                {r}×
              </option>
            ))}
          </select>
        </label>

        {spokenVoices.length > 1 && (
          <label className="flex items-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-400">
            Voice
            <select
              value={voiceURI ?? ''}
              onChange={(e) => speech.setVoiceURI(e.target.value)}
              className="max-w-[12rem] rounded-md border border-neutral-300 bg-transparent px-1.5 py-1 text-sm dark:border-neutral-700"
            >
              <option value="">Default</option>
              {spokenVoices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {status !== 'idle' && total > 0 && (
        <div className="mt-3">
          <div
            className="h-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-brand transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-neutral-500">
            Passage {Math.min(index + 1, total)} of {total}
          </p>
        </div>
      )}
    </div>
  )
}
