import { useState } from 'react'

/**
 * Lazy YouTube embed. Shows a lightweight thumbnail-style placeholder until
 * clicked, then loads the privacy-enhanced (youtube-nocookie) iframe. This
 * avoids loading YouTube's player (and cookies) for lessons the user never
 * plays, and keeps the page fast.
 *
 * When a lesson has no curated video, pass `searchUrl` instead of `videoId`:
 * the component renders a search card rather than an empty player.
 */
export function YouTubeEmbed({
  videoId,
  title = 'Lesson video',
  channel,
  searchUrl,
}: {
  videoId?: string
  title?: string
  channel?: string
  searchUrl?: string
}) {
  const [active, setActive] = useState(false)

  if (!videoId) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-neutral-400 bg-neutral-100 p-6 text-center dark:border-neutral-600 dark:bg-neutral-900">
        <p className="text-sm text-neutral-500">
          No curated video for this topic yet.
        </p>
        {searchUrl && (
          <a
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark"
          >
            Search YouTube for “{title}” ↗
          </a>
        )}
      </div>
    )
  }

  if (active) {
    return (
      <div className="space-y-2">
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-ink">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
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
        className="group relative block aspect-video w-full overflow-hidden rounded-lg bg-ink"
        aria-label={`Play video: ${title}`}
      >
        <img
          src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
          alt=""
          className="h-full w-full object-cover opacity-80 transition group-hover:opacity-100"
          loading="lazy"
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
  if (!channel) return null
  return (
    <p className="text-xs text-neutral-500">
      <span className="font-medium text-neutral-700 dark:text-neutral-300">
        {title}
      </span>{' '}
      · {channel}
    </p>
  )
}
