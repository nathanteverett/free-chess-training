// Storage abstraction for learner progress.
//
// Only a LocalStorageProgressStore exists today, but every consumer depends on
// this interface (never on localStorage directly). To add server-synced
// progress later, implement `ProgressStore` with an API-backed class and swap
// the instance provided in ProgressContext — no UI changes required.

export interface ProgressSnapshot {
  completedLessons: string[]
  solvedPuzzles: string[]
}

export interface ProgressStore {
  /** Returns the full current snapshot. */
  getSnapshot(): ProgressSnapshot

  isLessonComplete(slug: string): boolean
  markLessonComplete(slug: string): void
  markLessonIncomplete(slug: string): void

  isPuzzleSolved(id: string): boolean
  markPuzzleSolved(id: string): void

  /** Clears all stored progress. */
  reset(): void

  /** Subscribe to changes; returns an unsubscribe function. */
  subscribe(listener: () => void): () => void
}

const STORAGE_KEY = 'fct.progress.v1'

function emptySnapshot(): ProgressSnapshot {
  return { completedLessons: [], solvedPuzzles: [] }
}

/**
 * Progress persisted to the browser's localStorage. Safe to construct in
 * non-browser environments (tests/SSR): it falls back to an in-memory store.
 */
export class LocalStorageProgressStore implements ProgressStore {
  private snapshot: ProgressSnapshot
  private listeners = new Set<() => void>()
  private readonly storage: Storage | null

  constructor(storage: Storage | null = safeLocalStorage()) {
    this.storage = storage
    this.snapshot = this.load()
  }

  private load(): ProgressSnapshot {
    if (!this.storage) return emptySnapshot()
    try {
      const raw = this.storage.getItem(STORAGE_KEY)
      if (!raw) return emptySnapshot()
      const parsed = JSON.parse(raw) as Partial<ProgressSnapshot>
      return {
        completedLessons: parsed.completedLessons ?? [],
        solvedPuzzles: parsed.solvedPuzzles ?? [],
      }
    } catch {
      return emptySnapshot()
    }
  }

  private persist(): void {
    if (this.storage) {
      try {
        this.storage.setItem(STORAGE_KEY, JSON.stringify(this.snapshot))
      } catch {
        // Ignore quota / private-mode write failures; in-memory state still works.
      }
    }
    this.listeners.forEach((l) => l())
  }

  getSnapshot(): ProgressSnapshot {
    return this.snapshot
  }

  isLessonComplete(slug: string): boolean {
    return this.snapshot.completedLessons.includes(slug)
  }

  markLessonComplete(slug: string): void {
    if (this.isLessonComplete(slug)) return
    this.snapshot = {
      ...this.snapshot,
      completedLessons: [...this.snapshot.completedLessons, slug],
    }
    this.persist()
  }

  markLessonIncomplete(slug: string): void {
    if (!this.isLessonComplete(slug)) return
    this.snapshot = {
      ...this.snapshot,
      completedLessons: this.snapshot.completedLessons.filter((s) => s !== slug),
    }
    this.persist()
  }

  isPuzzleSolved(id: string): boolean {
    return this.snapshot.solvedPuzzles.includes(id)
  }

  markPuzzleSolved(id: string): void {
    if (this.isPuzzleSolved(id)) return
    this.snapshot = {
      ...this.snapshot,
      solvedPuzzles: [...this.snapshot.solvedPuzzles, id],
    }
    this.persist()
  }

  reset(): void {
    this.snapshot = emptySnapshot()
    this.persist()
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
}

function safeLocalStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage
    }
  } catch {
    // Access can throw in some privacy modes.
  }
  return null
}
