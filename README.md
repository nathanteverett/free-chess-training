# Free Chess Training

An open-source chess curriculum that takes players from complete beginner to
master preparation. Every lesson pairs a written **article** and an embedded
**video** with interactive **puzzles** (progressive hints + explained ideas),
links to **grandmaster games**, and a built-in **Stockfish engine** for checking
any position — all running in the browser, no account or server required.

The curriculum is a 78-module beginner-to-master sequence
(`comprehensive_chess_curriculum.md`), grouped into seven modules from board
basics to competitive mastery.

## Features

- **Curriculum browser** — 78 lessons across 7 modules, with per-lesson and
  overall progress tracking.
- **Lessons** — Markdown/MDX article, lazy YouTube embed, practice puzzles,
  grandmaster game links, and mark-complete tracking.
- **Puzzle trainer** — play the solution line against auto-replied opponent
  moves, with **progressive hints** (revealed one at a time) and an **explained
  idea** on solve.
- **Analysis board** — play both sides, load any FEN, and get a live Stockfish
  evaluation (eval bar + best line), plus an "Open in Lichess" link.
- **Local-first progress** — saved to `localStorage` today, behind a storage
  interface so a backend can be added later without touching the UI.

## Tech stack

React + TypeScript + Vite · Tailwind CSS · [chess.js] (rules) ·
[react-chessboard] (board) · [Stockfish 16] WASM (engine) · MDX (lessons).

[chess.js]: https://github.com/jhlywa/chess.js
[react-chessboard]: https://github.com/Clariity/react-chessboard
[Stockfish 16]: https://github.com/nmrugg/stockfish.js

## Quick start

```bash
npm install        # also copies the Stockfish engine into public/ (postinstall)
npm run dev        # start the dev server at http://localhost:5173
```

Other scripts:

```bash
npm run build             # type-check + production build to dist/
npm run preview           # preview the production build
npm test                  # run unit tests (puzzle validation, etc.)
npm run generate-lessons  # (re)generate lesson stubs from the curriculum
```

> **Engine note:** we ship the **single-threaded** Stockfish build on purpose —
> it needs no special COOP/COEP headers, so it runs in `vite dev` and on any
> static host with zero config. The engine files (including a ~39 MB neural net)
> are copied from `node_modules` into `public/stockfish/` by
> `scripts/copy-engine.mjs` and are gitignored rather than committed.

## Project structure

```
comprehensive_chess_curriculum.md   # master syllabus (source for lessons)
scripts/
  copy-engine.mjs        # copies Stockfish into public/ (install/dev/build)
  generate-lessons.mjs   # generates MDX lesson stubs from the curriculum
  smoke.mjs              # headless end-to-end check of a running dev server
src/
  content/
    lessons/*.mdx        # one file per lesson (frontmatter + article)
    puzzles/index.ts     # puzzle bank (FEN + solution + hints + idea)
    curriculum.ts        # module groups + grouping logic
    lessons.ts           # loads lessons via import.meta.glob
  components/
    chess/               # BoardView, PuzzleTrainer, EnginePanel, EvalBar
    media/               # YouTubeEmbed, GameLinks
    layout/              # app shell
  engine/                # EngineService (Stockfish worker) + useEngine hook
  progress/              # ProgressStore interface + localStorage impl + context
  routes/                # Home, Lesson, Analysis, CurriculumReference
  lib/                   # chess helpers, Lichess link builder
```

## Authoring content

You add lessons by editing MDX files and puzzle data — see
[docs/authoring-lessons.md](docs/authoring-lessons.md) for the full guide
(frontmatter fields, attaching videos/puzzles/games, and importing themed
puzzles from the free Lichess database).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Contributions of lessons, puzzles, and
translations are welcome.

## License

[GPL-3.0-or-later](LICENSE). Stockfish is GPL-3.0; chess.js is BSD; the curriculum
document and this code are GPL-3.0. Not affiliated with Lichess or FIDE.
