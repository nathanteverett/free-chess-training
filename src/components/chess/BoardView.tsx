import {
  useLayoutEffect,
  useMemo,
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

/** Board square colors, sampled to sit between the two pixel-art piece sets. */
export const LIGHT_SQUARE = '#cfdcf3'
export const DARK_SQUARE = '#5d6ba4'

/**
 * react-chessboard piece keys are `wP`, `bK`, … Map each to its pixel-art sprite
 * in public/pieces. Rendered with `image-rendering: pixelated` so the art stays
 * crisp at board size instead of being smoothed into mush.
 */
const PIECE_FILES: Record<string, string> = {
  wP: 'white-pawn',
  wN: 'white-knight',
  wB: 'white-bishop',
  wR: 'white-rook',
  wQ: 'white-queen',
  wK: 'white-king',
  bP: 'black-pawn',
  bN: 'black-knight',
  bB: 'black-bishop',
  bR: 'black-rook',
  bQ: 'black-queen',
  bK: 'black-king',
}

type PieceRenderer = (props: { squareWidth: number }) => JSX.Element
type CustomPieces = Record<string, PieceRenderer>

/**
 * Build the customPieces map once. The white set is near-white, so a soft drop
 * shadow keeps it legible on light squares; the black set gets a lighter one.
 */
const customPieces: CustomPieces = Object.fromEntries(
  Object.entries(PIECE_FILES).map(([piece, file]) => [
    piece,
    ({ squareWidth }: { squareWidth: number }) => (
      <div
        style={{
          width: squareWidth,
          height: squareWidth,
          backgroundImage: `url(/pieces/${file}.png)`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated',
          filter:
            piece[0] === 'w'
              ? 'drop-shadow(0 1px 1px rgba(26, 19, 30, 0.55))'
              : 'drop-shadow(0 1px 1px rgba(221, 230, 251, 0.35))',
        }}
      />
    ),
  ]),
) as CustomPieces

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

  const pieces = useMemo(() => customPieces, [])

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
        customPieces={pieces}
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
