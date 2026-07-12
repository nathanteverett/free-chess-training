import { useState } from 'react'

/**
 * Lazy YouTube embed. Shows a lightweight thumbnail-style placeholder until
 * clicked, then loads the privacy-enhanced (youtube-nocookie) iframe. This
 * avoids loading YouTube's player (and cookies) for lessons the user never
 * plays, and keeps the page fast.
 */
export function YouTubeEmbed({
  videoId,
  title = 'Lesson video',
}: {
  videoId: string
  title?: string
}) {
  const [active, setActive] = useState(false)

  if (!videoId) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed border-neutral-400 bg-neutral-100 text-sm text-neutral-500 dark:border-neutral-600 dark:bg-neutral-800">
        No video yet — add a <code className="mx-1">youtubeId</code> in this
        lesson’s frontmatter.
      </div>
    )
  }

  if (active) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
        <iframe
          className="h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  return (
    <button
      onClick={() => setActive(true)}
      className="group relative block aspect-video w-full overflow-hidden rounded-lg bg-black"
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
  )
}
