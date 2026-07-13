// Pulls the spoken text of an article out of the DOM it already rendered into.
//
// Reading the live DOM rather than re-parsing the MDX source means the narration
// always matches what is on the page, and any React component an author drops
// into a lesson participates for free: it opts out of the audio by rendering
// `data-tts="skip"`, or contributes audio-only wording with `data-tts="only"`.

import { chunkForSpeech, speakable } from './notation'

/** Elements that never contribute narration, whatever they contain. */
const SKIPPED_TAGS = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'SVG', 'CANVAS'])

/** Tags that end a spoken block, so two paragraphs don't run into one sentence. */
const BLOCK_TAGS = new Set([
  'P',
  'DIV',
  'SECTION',
  'ARTICLE',
  'LI',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'BLOCKQUOTE',
  'PRE',
  'TR',
  'FIGCAPTION',
])

const isElement = (node: Node): node is Element => node.nodeType === 1

/**
 * Walk `root`, collecting the text of each block in document order.
 *
 * `data-tts="skip"` prunes an element and its subtree — for boards, diagrams,
 * and anything else that only makes sense to look at. `data-tts="only"` marks
 * text that exists solely to be heard; it is visually hidden but read normally,
 * so it needs no special handling here.
 */
function blocksOf(root: Element): string[] {
  const blocks: string[] = []
  let current = ''

  const flush = () => {
    const text = current.replace(/\s+/g, ' ').trim()
    if (text) blocks.push(text)
    current = ''
  }

  const visit = (node: Node) => {
    if (node.nodeType === 3) {
      current += node.textContent ?? ''
      return
    }
    if (!isElement(node)) return
    if (SKIPPED_TAGS.has(node.tagName)) return
    if (node.getAttribute('data-tts') === 'skip') return
    if (node.getAttribute('aria-hidden') === 'true') return

    const isBlock = BLOCK_TAGS.has(node.tagName)
    if (isBlock) flush()
    for (const child of Array.from(node.childNodes)) visit(child)
    if (isBlock) flush()
  }

  for (const child of Array.from(root.childNodes)) visit(child)
  flush()
  return blocks
}

/**
 * The narration for a rendered article: notation expanded into words, split
 * into utterance-sized chunks that never straddle a block boundary.
 */
export function speechChunks(root: Element): string[] {
  return blocksOf(root).flatMap((block) => chunkForSpeech(speakable(block)))
}
