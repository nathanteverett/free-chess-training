// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { speakable, chunkForSpeech } from './notation'
import { speechChunks } from './extract'

describe('speakable', () => {
  it('reads a piece move', () => {
    expect(speakable('Play Nf3.')).toBe('Play knight to F three.')
  })

  it('reads a capture with check', () => {
    expect(speakable('Bxh7+ is the Greek gift.')).toBe(
      'bishop takes H seven, check is the Greek gift.',
    )
  })

  it('reads a pawn capture', () => {
    expect(speakable('exd5')).toBe('E pawn takes D five')
  })

  it('reads a mating move', () => {
    expect(speakable('Qh7#')).toBe('queen to H seven, checkmate')
  })

  it('reads promotion', () => {
    expect(speakable('e8=Q+')).toBe('pawn to E eight promoting to queen, check')
  })

  it('reads a disambiguated move', () => {
    expect(speakable('Nbd7')).toBe('knight from B to D seven')
  })

  it('reads castling', () => {
    expect(speakable('O-O and O-O-O')).toBe(
      'castles kingside and castles queenside',
    )
  })

  it('reads a square named in prose as a square, not a move', () => {
    expect(speakable('Control the e4 square.')).toBe(
      'Control the E four square.',
    )
  })

  it('reads a file reference', () => {
    expect(speakable('Double rooks on the d-file.')).toBe(
      'Double rooks on the D file.',
    )
  })

  it('leaves ordinary prose alone', () => {
    const prose = 'The bishop is a long-range piece; the knight is not.'
    expect(speakable(prose)).toBe(prose)
  })
})

describe('chunkForSpeech', () => {
  it('merges short sentences up to the limit', () => {
    expect(chunkForSpeech('One. Two. Three.', 220)).toEqual([
      'One. Two. Three.',
    ])
  })

  it('splits at sentence boundaries once the limit is passed', () => {
    const sentence = `${'a'.repeat(100)}.`
    const chunks = chunkForSpeech([sentence, sentence, sentence].join(' '), 120)
    expect(chunks).toHaveLength(3)
    expect(chunks.every((c) => c.length <= 120)).toBe(true)
  })

  it('breaks a single over-long sentence instead of emitting it whole', () => {
    const chunks = chunkForSpeech(`${'word '.repeat(100)}.`, 80)
    expect(chunks.every((c) => c.length <= 80)).toBe(true)
  })
})

/** Render an HTML fragment and hand back its container element. */
function render(html: string): Element {
  const el = document.createElement('div')
  el.innerHTML = html
  return el
}

describe('speechChunks', () => {
  it('reads block elements in document order', () => {
    expect(speechChunks(render('<h2>Heading</h2><p>Body text.</p>'))).toEqual([
      'Heading',
      'Body text.',
    ])
  })

  it('never runs two blocks into one sentence', () => {
    const chunks = speechChunks(render('<p>First</p><p>Second</p>'))
    expect(chunks).toEqual(['First', 'Second'])
  })

  it('skips a data-tts="skip" subtree', () => {
    const chunks = speechChunks(
      render('<p>Spoken.</p><div data-tts="skip"><p>Visual only.</p></div>'),
    )
    expect(chunks).toEqual(['Spoken.'])
  })

  it('speaks visually hidden narration', () => {
    const chunks = speechChunks(
      render('<p>Look at the board. <span class="sr-only">On c4.</span></p>'),
    )
    expect(chunks).toEqual(['Look at the board. On C four.'])
  })

  it('expands notation it finds in the DOM', () => {
    expect(speechChunks(render('<p>Play Nf3.</p>'))).toEqual([
      'Play knight to F three.',
    ])
  })

  it('skips aria-hidden decoration', () => {
    expect(
      speechChunks(render('<p><span aria-hidden="true">▶</span>Play.</p>')),
    ).toEqual(['Play.'])
  })
})
