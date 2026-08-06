import { useState } from 'react'

/**
 * Lazy YouTube embed. Without a video id, it preserves the lesson's video
 * space as an intentionally blank placeholder.
 */
export function YouTubeEmbed({
  videoId,
  title = 'Lesson video',
  channel,
}: {
  videoId?: string
  title?: string
  channel?: string
}) {
  const [active, setActive] = useState(false)

  if (!videoId) {
    return (
      <div
        className="aspect-video w-full rounded-lg border border-dashed border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900"
        aria-hidden="true"
      />
    )
  }

  if (active) {
    return (
      <div className="space-y-2">
        <div className="mx-auto aspect-[9/16] w-full max-w-sm overflow-hidden rounded-xl bg-ink">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <VideoCaption title={title} channel={channel} />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() => setActive(true)}
        className="group relative mx-auto block aspect-[9/16] w-full max-w-sm overflow-hidden rounded-xl bg-ink"
        aria-label={`Play video: ${title}`}
      >
        <img
          src={`https://i.ytimg.com/vi/${videoId}/frame0.jpg`}
          alt=""
          className="h-full w-full object-cover opacity-80 transition group-hover:opacity-100"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.onerror = null
            event.currentTarget.src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
          }}
        />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition group-hover:scale-110">
            <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7 fill-current">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </span>
      </button>
      <VideoCaption title={title} channel={channel} />
    </div>
  )
}

function VideoCaption({ title, channel }: { title: string; channel?: string }) {
  return (
    <p className="mx-auto max-w-sm text-xs text-neutral-500">
      <span className="font-medium text-neutral-700 dark:text-neutral-300">
        {title}
      </span>
      {channel && <> · {channel}</>}
    </p>
  )
}
