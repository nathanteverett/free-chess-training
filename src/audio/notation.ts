// Turns written chess into text a speech synthesizer can read aloud.
//
// Algebraic notation is written for the eye: "Bxh7+" is four glyphs a reader
// decodes instantly, but a TTS voice says "bee-ex-aitch-seven-plus". Every
// string that reaches the synthesizer goes through `speakable()` first.

const PIECE_NAMES: Record<string, string> = {
  K: 'king',
  Q: 'queen',
  R: 'rook',
  B: 'bishop',
  N: 'knight',
}

const RANK_WORDS = [
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
]

/**
 * A square as spoken: "h7" → "H seven". The file is uppercased because voices
 * read a bare lowercase letter as a word ("a" as the article "uh") but read an
 * uppercase one as a letter name.
 */
function speakSquare(square: string): string {
  const file = square[0].toUpperCase()
  const rank = RANK_WORDS[Number(square[1]) - 1]
  return `${file} ${rank}`
}

/** Trailing "+" / "#" on a move. */
function speakSuffix(suffix: string): string {
  if (suffix.includes('#')) return ', checkmate'
  if (suffix.includes('+')) return ', check'
  return ''
}

/** "=Q" → " promoting to queen". */
function speakPromotion(promotion: string): string {
  if (!promotion) return ''
  return ` promoting to ${PIECE_NAMES[promotion[1].toUpperCase()]}`
}

/**
 * A full SAN move: optional piece letter, optional disambiguating file/rank,
 * optional capture, destination square, optional promotion, optional check
 * marker. Anchored between non-notation characters so ordinary prose is left
 * alone.
 */
// The trailing lookahead — rather than a `\b` — is what lets the check marker
// be part of the match: there is no word boundary between "+" and the space
// after it, so `\b` would force the "+" back out of the match.
const SAN =
  /\b(?:([KQRBN])([a-h]|[1-8])?|([a-h]))?(x)?([a-h][1-8])(=[QRBN])?([+#]?)(?!\w)/g

/** Castling, longest first so O-O-O is never matched as O-O followed by "-O". */
const CASTLING = /\bO-O-O\b|\bO-O\b|\b0-0-0\b|\b0-0\b/g

/** A bare square reference in prose: "the e4 square", "control of d5". */
const BARE_SQUARE = /\b([a-h][1-8])\b/g

/** "the f-file", "the 7th rank" — the hyphen makes voices stumble. */
const FILE_REF = /\b([a-h])-file\b/g

/**
 * Rewrite chess notation inside a run of prose into words. Non-chess text
 * passes through untouched.
 */
export function speakable(text: string): string {
  let out = text

  out = out.replace(CASTLING, (move) =>
    move.length > 3 ? 'castles queenside' : 'castles kingside',
  )

  out = out.replace(FILE_REF, (_m, file: string) => `${file.toUpperCase()} file`)

  out = out.replace(
    SAN,
    (
      match,
      piece: string | undefined,
      disambiguation: string | undefined,
      pawnFile: string | undefined,
      capture: string | undefined,
      destination: string,
      promotion: string | undefined,
      suffix: string,
    ) => {
      // A destination square with no piece letter, no capture and no pawn file
      // is just a square named in prose ("the e4 square") — not a move.
      if (!piece && !capture && !pawnFile && !promotion && !suffix) return match

      const parts: string[] = []
      if (piece) {
        parts.push(PIECE_NAMES[piece])
        if (disambiguation) parts.push(`from ${disambiguation.toUpperCase()}`)
      } else if (pawnFile) {
        parts.push(`${pawnFile.toUpperCase()} pawn`)
      } else {
        parts.push('pawn')
      }
      parts.push(capture ? 'takes' : 'to')
      parts.push(speakSquare(destination))

      return parts.join(' ') + speakPromotion(promotion ?? '') + speakSuffix(suffix)
    },
  )

  // Whatever squares are left are prose references, not moves.
  out = out.replace(BARE_SQUARE, (square) => speakSquare(square))

  return out
}

/**
 * Split a block of prose into utterance-sized chunks. Browsers cut off long
 * utterances (Chrome silently truncates past ~200-300 characters) and a queue
 * of sentences also gives us a progress indicator and a resume point, so we
 * break on sentence boundaries and merge the short fragments back up.
 */
export function chunkForSpeech(text: string, maxLength = 220): string[] {
  const sentences = text
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?:;])\s+/)
    .filter(Boolean)

  const chunks: string[] = []
  for (const sentence of sentences) {
    const last = chunks[chunks.length - 1]
    if (last && last.length + sentence.length + 1 <= maxLength) {
      chunks[chunks.length - 1] = `${last} ${sentence}`
    } else if (sentence.length <= maxLength) {
      chunks.push(sentence)
    } else {
      // A single sentence over the limit: break it at commas, then hard-wrap
      // whatever is still too long.
      for (const clause of sentence.split(/(?<=,)\s+/)) {
        let rest = clause
        while (rest.length > maxLength) {
          const cut = rest.lastIndexOf(' ', maxLength)
          chunks.push(rest.slice(0, cut > 0 ? cut : maxLength))
          rest = rest.slice(cut > 0 ? cut + 1 : maxLength)
        }
        if (rest) chunks.push(rest)
      }
    }
  }
  return chunks
}
