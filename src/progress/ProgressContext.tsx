import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import {
  LocalStorageProgressStore,
  type ProgressSnapshot,
  type ProgressStore,
} from './ProgressStore'

const ProgressStoreContext = createContext<ProgressStore | null>(null)

/**
 * Provides the app-wide progress store. Defaults to localStorage-backed
 * storage; pass a different `store` (e.g. an API-backed one) to swap the
 * persistence layer without touching consumers.
 */
export function ProgressProvider({
  children,
  store,
}: {
  children: ReactNode
  store?: ProgressStore
}) {
  const value = useMemo(() => store ?? new LocalStorageProgressStore(), [store])
  return (
    <ProgressStoreContext.Provider value={value}>
      {children}
    </ProgressStoreContext.Provider>
  )
}

function useStore(): ProgressStore {
  const store = useContext(ProgressStoreContext)
  if (!store) {
    throw new Error('useProgress must be used within a <ProgressProvider>')
  }
  return store
}

/**
 * Reactive access to learner progress. Re-renders when progress changes,
 * including changes made in other components sharing the same store.
 */
export function useProgress() {
  const store = useStore()

  const snapshot: ProgressSnapshot = useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => store.getSnapshot(),
    () => store.getSnapshot(),
  )

  const markLessonComplete = useCallback(
    (slug: string) => store.markLessonComplete(slug),
    [store],
  )
  const markLessonIncomplete = useCallback(
    (slug: string) => store.markLessonIncomplete(slug),
    [store],
  )
  const markPuzzleSolved = useCallback(
    (id: string) => store.markPuzzleSolved(id),
    [store],
  )
  const reset = useCallback(() => store.reset(), [store])

  return {
    completedLessons: snapshot.completedLessons,
    solvedPuzzles: snapshot.solvedPuzzles,
    isLessonComplete: (slug: string) => snapshot.completedLessons.includes(slug),
    isPuzzleSolved: (id: string) => snapshot.solvedPuzzles.includes(id),
    markLessonComplete,
    markLessonIncomplete,
    markPuzzleSolved,
    reset,
  }
}
