import type { ReactNode } from 'react'

/**
 * Text that exists only for the narration: visually hidden, read aloud.
 *
 * Use it where the page can show something the ear cannot hear — to describe a
 * position a reader can see, or to voice a transition that the layout makes
 * obvious on screen.
 *
 * ```mdx
 * <Spoken>Picture the white bishop on c4, aimed straight at f7.</Spoken>
 * ```
 */
export function Spoken({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>
}

/**
 * Content the narration skips: shown on screen, never spoken.
 *
 * Use it for anything that only works visually — a long move list, a table, a
 * diagram — usually paired with a `<Spoken>` sentence that says the same thing
 * in words a listener can follow.
 *
 * ```mdx
 * <Silent>
 * | Move | Idea |
 * | ---- | ---- |
 * | 1.e4 | Claim the center |
 * </Silent>
 * ```
 */
export function Silent({ children }: { children: ReactNode }) {
  return <div data-tts="skip">{children}</div>
}

/** The components every lesson article can use without importing them. */
export const mdxComponents = { Spoken, Silent }
