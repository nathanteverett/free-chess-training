import { useCallback, useLayoutEffect, useState } from 'react'

const MIN_BOARD = 280

/**
 * Sizes a board to the largest square that fits both its container and the
 * viewport. Attach `containerRef` to the element the board lives in — it is a
 * callback ref, so the container may mount later (e.g. once a game loads).
 *
 * `chrome` is the vertical space taken by everything else on the page (nav,
 * headings, player bars); `reserved` is horizontal space taken beside the board
 * inside the same container, e.g. the eval bar.
 */
export function useBoardSize({ chrome = 260, reserved = 0 } = {}) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const [size, setSize] = useState(MIN_BOARD)

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    setContainer(node)
  }, [])

  useLayoutEffect(() => {
    if (!container) return
    const update = () =>
      setSize(
        Math.max(
          MIN_BOARD,
          Math.min(container.clientWidth - reserved, window.innerHeight - chrome),
        ),
      )
    update()
    const observer = new ResizeObserver(update)
    observer.observe(container)
    window.addEventListener('resize', update)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [container, chrome, reserved])

  return { containerRef, size }
}
