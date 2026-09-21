// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { BoardViewProps } from '../components/chess/BoardView'
import { ProgressProvider } from '../progress/ProgressContext'
import { LocalStorageProgressStore } from '../progress/ProgressStore'
import { Lesson } from './Lesson'

vi.mock('../content/lessons', () => {
  const lessons = ['first', 'second'].map((slug, order) => ({
    slug,
    order,
    title: `${slug} lesson`,
    category: 'tactics',
    summary: 'Practice a knight fork.',
    puzzleIds: ['knight-fork-queen'],
    Article: () => <p>Lesson article</p>,
  }))
  return {
    getAllLessons: () => lessons,
    getLesson: (slug: string) => lessons.find((lesson) => lesson.slug === slug),
    getAdjacentLessons: (slug: string) => ({
      next: slug === 'first' ? lessons[1] : undefined,
    }),
  }
})

// Keep the actual trainer and chess rules; replace only the drag-and-drop UI.
vi.mock('../components/chess/BoardView', () => ({
  BoardView: ({ fen, onPieceDrop }: BoardViewProps) => (
    <div data-testid="board" data-fen={fen}>
      <button onClick={() => onPieceDrop?.('g5', 'f7', 'wN')}>Play fork</button>
      <button onClick={() => onPieceDrop?.('f7', 'd8', 'wN')}>Capture queen</button>
      <button onClick={() => onPieceDrop?.('g5', 'h3', 'wN')}>Wrong move</button>
    </div>
  ),
}))

describe('lesson puzzle tabs', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    vi.useFakeTimers()
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/lesson/first']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ProgressProvider store={new LocalStorageProgressStore(null)}>
            <Routes>
              <Route path="/lesson/:slug" element={<Lesson />} />
            </Routes>
          </ProgressProvider>
        </MemoryRouter>,
      )
    })
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  async function click(label: string) {
    const control = [...container.querySelectorAll<HTMLElement>('button, a')]
      .find((element) => element.textContent === label)
    expect(control, `missing control: ${label}`).toBeTruthy()
    await act(async () => control!.click())
  }

  function boardFen() {
    return container.querySelector('[data-testid="board"]')?.getAttribute('data-fen')
  }

  it('preserves moves, hints and misses across tabs and still allows an explicit reset', async () => {
    await click('Puzzles')
    const startingFen = boardFen()
    await click('Wrong move')
    await click('Play fork')
    await act(async () => vi.advanceTimersByTime(350))
    await click('Show a hint')
    const progressedFen = boardFen()
    expect(progressedFen).not.toBe(startingFen)

    for (const tab of ['Article', 'Video', 'GM games']) {
      await click(tab)
      const board = container.querySelector('[data-testid="board"]')
      expect(board?.closest('section')?.hidden).toBe(true)
      await click('Puzzles')
      expect(boardFen()).toBe(progressedFen)
      expect(container.textContent).toContain('Progress: 1 / 2 moves · 1 misses')
      expect(container.textContent).toContain('Hint 1:')
    }

    await click('Reset')
    expect(boardFen()).toBe(startingFen)
    expect(container.textContent).toContain('Progress: 0 / 2 moves')
    expect(container.textContent).not.toContain('Hint 1:')
    expect(container.textContent).not.toContain('1 misses')
  })

  it('keeps the pending opponent reply when switching tabs mid-move', async () => {
    await click('Puzzles')
    await click('Play fork')
    await click('Article')
    await act(async () => vi.advanceTimersByTime(350))
    await click('Puzzles')
    await click('Capture queen')
    expect(container.textContent).toContain('Solved! Well done.')
  })

  it('starts fresh when navigating to another lesson that shares the puzzle', async () => {
    await click('Puzzles')
    const startingFen = boardFen()
    await click('Play fork')
    await click('Show a hint')
    await click('second lesson →')
    await act(async () => vi.advanceTimersByTime(350))
    expect(container.querySelector('h1')?.textContent).toBe('second lesson')
    expect(boardFen()).toBe(startingFen)
    expect(container.textContent).toContain('Progress: 0 / 2 moves')
    expect(container.textContent).not.toContain('Hint 1:')
  })
})
