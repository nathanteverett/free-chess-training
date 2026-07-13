import { Link, NavLink, Outlet } from 'react-router-dom'
import { useProgress } from '../../progress/ProgressContext'
import { getAllLessons } from '../../content/lessons'

const navItem =
  'px-3 py-2 rounded-md text-sm font-medium transition-colors'
const navActive = 'bg-brand text-white'
const navIdle =
  'text-neutral-700 hover:bg-neutral-200 dark:text-neutral-200 dark:hover:bg-neutral-800'

export function Layout() {
  const { completedLessons } = useProgress()
  const total = getAllLessons().length
  const pct = total ? Math.round((completedLessons.length / total) * 100) : 0

  return (
    <div className="min-h-full bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <img
              src={`${import.meta.env.BASE_URL}pieces/white-knight.png`}
              alt=""
              className="h-7 w-7 rounded bg-brand-dark p-0.5 [image-rendering:pixelated]"
            />
            <span>Free Chess Training</span>
          </Link>
          <nav className="ml-auto flex items-center gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `${navItem} ${isActive ? navActive : navIdle}`
              }
            >
              Curriculum
            </NavLink>
            <NavLink
              to="/analysis"
              className={({ isActive }) =>
                `${navItem} ${isActive ? navActive : navIdle}`
              }
            >
              Analysis board
            </NavLink>
            <NavLink
              to="/play"
              className={({ isActive }) =>
                `${navItem} ${isActive ? navActive : navIdle}`
              }
            >
              Play live
            </NavLink>
          </nav>
        </div>
        {/* Overall progress strip */}
        <div className="h-1 w-full bg-neutral-200 dark:bg-neutral-800">
          <div
            className="h-full bg-brand transition-[width] duration-500"
            style={{ width: `${pct}%` }}
            title={`${completedLessons.length} / ${total} lessons complete`}
          />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>

      <footer className="mx-auto max-w-5xl px-4 py-8 text-xs text-neutral-500">
        <p>
          Open-source chess curriculum · GPL-3.0. Engine: Stockfish 16
          (in-browser). Not affiliated with Lichess or FIDE.
        </p>
      </footer>
    </div>
  )
}
