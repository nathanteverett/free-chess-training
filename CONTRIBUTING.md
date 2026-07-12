# Contributing

Thanks for helping build a free chess curriculum! Contributions of lessons,
puzzles, fixes, and features are welcome.

## Development setup

Requires Node.js 20+.

```bash
npm install     # installs deps and copies Stockfish into public/
npm run dev     # http://localhost:5173
```

## Useful scripts

| Command                    | What it does                                            |
| -------------------------- | ------------------------------------------------------- |
| `npm run dev`              | Start the Vite dev server.                              |
| `npm run build`            | Type-check and build for production.                    |
| `npm run preview`          | Serve the production build locally.                     |
| `npm test`                 | Run unit tests (puzzle validation, etc.).               |
| `npm run typecheck`        | Type-check without emitting.                            |
| `npm run generate-lessons` | Generate missing lesson stubs (never overwrites files). |
| `npm run copy-engine`      | Re-copy the Stockfish engine into `public/stockfish/`.  |

## Verifying changes end-to-end

With the dev server running, `scripts/smoke.mjs` drives a headless browser to
check that the app renders, puzzles and hints work, progress persists, and the
Stockfish engine actually evaluates a position:

```bash
npm run dev            # in one terminal
node scripts/smoke.mjs # in another (requires: npx playwright install chromium)
```

## Contributing content

- **Lessons and puzzles:** see [docs/authoring-lessons.md](docs/authoring-lessons.md).
  Always run `npm test` after adding puzzles so illegal solution lines are caught.
- Keep the master syllabus (`comprehensive_chess_curriculum.md`) authoritative;
  lesson pages break it into practice.

## Code conventions

- TypeScript, strict mode. Prefer small, focused components.
- UI depends on the `ProgressStore` **interface**, never on `localStorage`
  directly — this keeps a future backend a drop-in swap.
- Match the style of surrounding code; keep comments about *why*, not *what*.

## Licensing

By contributing you agree your contributions are licensed under
[GPL-3.0-or-later](LICENSE). Only add third-party assets whose licenses are
GPL-compatible.
