import { Link, NavLink, Outlet } from 'react-router-dom'
import { useProgress } from '../../progress/ProgressContext'
import { getAllLessons } from '../../content/lessons'

const navItem =
  'px-2.5 py-1.5 rounded-md text-[13.5px] whitespace-nowrap transition-colors'
const navActive = 'bg-neutral-100 text-ink font-semibold'
const navIdle = 'text-neutral-500 hover:text-ink'

export function Layout() {
  const { completedLessons } = useProgress()
  const total = getAllLessons().length
  const pct = total ? Math.round((completedLessons.length / total) * 100) : 0

  return (
    <div className="min-h-full bg-page text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-290 items-center gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand">
              <img
                src={`${import.meta.env.BASE_URL}pieces/white-knight.png`}
                alt=""
                className="h-5.5 w-5.5 [image-rendering:pixelated]"
              />
            </span>
            <span className="text-[15px] font-bold tracking-tight">
              Free Chess Training
            </span>
          </Link>
          <span className="hidden border-l border-line pl-4 text-xs text-neutral-500 lg:inline">
            Free, open-source chess curriculum, beginner to master
          </span>
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
        <div className="h-1 w-full bg-neutral-200">
          <div
            className="h-full bg-brand transition-[width] duration-500"
            style={{ width: `${pct}%` }}
            title={`${completedLessons.length} / ${total} lessons complete`}
          />
        </div>
      </header>

      <main className="mx-auto max-w-290 animate-[fadeIn_0.3s_cubic-bezier(0.16,1,0.3,1)_both] px-4 py-6 sm:px-6">
        <Outlet />
      </main>

      <footer className="mx-auto max-w-290 px-4 py-8 text-xs text-neutral-500 sm:px-6">
        <p>
          Open-source chess curriculum · GPL-3.0. Engine: Stockfish 16
          (in-browser). Not affiliated with Lichess or FIDE.
        </p>
      </footer>
    </div>
  )
}
