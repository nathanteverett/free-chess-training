import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { Chessboard } from 'react-chessboard'

export interface BoardViewProps {
  /** Position to render, as a FEN string. */
  fen: string
  orientation?: 'white' | 'black'
  /**
   * Called when the user drops a piece. Return true to accept the move, false
   * to snap it back. The parent owns move legality/game state.
   */
  onPieceDrop?: (from: string, to: string, piece: string) => boolean
  arePiecesDraggable?: boolean
  /** Per-square style overlays, e.g. to highlight a hint square. */
  customSquareStyles?: Record<string, CSSProperties>
  /** Max pixel width; the board also shrinks to fit its container. */
  maxWidth?: number
}

/** Board square colors chosen to keep both piece colors clearly legible. */
export const LIGHT_SQUARE = '#cfdcf3'
export const DARK_SQUARE = '#5d6ba4'

/**
 * Responsive wrapper around react-chessboard. react-chessboard needs an
 * explicit pixel width, so we measure the container and pass it down, capped at
 * `maxWidth`.
 */
export function BoardView({
  fen,
  orientation = 'white',
  onPieceDrop,
  arePiecesDraggable = true,
  customSquareStyles,
  maxWidth = 480,
}: BoardViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(320)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setWidth(Math.min(el.clientWidth, maxWidth))
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [maxWidth])

  return (
    <div ref={containerRef} className="w-full" style={{ maxWidth }}>
      <Chessboard
        position={fen}
        boardOrientation={orientation}
        boardWidth={width}
        arePiecesDraggable={arePiecesDraggable}
        onPieceDrop={(from, to, piece) =>
          onPieceDrop ? onPieceDrop(from, to, piece) : false
        }
        customSquareStyles={customSquareStyles}
        customBoardStyle={{
          borderRadius: '6px',
          boxShadow: '0 2px 16px rgba(26, 19, 30, 0.35)',
        }}
        customDarkSquareStyle={{ backgroundColor: DARK_SQUARE }}
        customLightSquareStyle={{ backgroundColor: LIGHT_SQUARE }}
      />
    </div>
  )
}
