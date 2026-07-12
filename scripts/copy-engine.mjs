// Copies the single-threaded Stockfish 16 build from node_modules into
// public/stockfish so Vite serves it as a static asset. We use the
// single-threaded (`-single`) build deliberately: it does NOT require the
// COOP/COEP cross-origin-isolation headers that the multi-threaded build needs,
// so it runs on any static host and in `vite dev` without extra config.
//
// These files are large (a ~39 MB NNUE network), so they are gitignored and
// regenerated here on `postinstall` / `predev` / `prebuild` instead of being
// committed.
import { mkdirSync, copyFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = join(root, 'node_modules', 'stockfish', 'src')
const outDir = join(root, 'public', 'stockfish')

// The single-threaded engine, a no-SIMD fallback, and the shared NNUE network.
const files = [
  'stockfish-nnue-16-single.js',
  'stockfish-nnue-16-single.wasm',
  'stockfish-nnue-16-no-simd.js',
  'stockfish-nnue-16-no-simd.wasm',
  'nn-5af11540bbfe.nnue',
]

if (!existsSync(srcDir)) {
  console.warn(
    '[copy-engine] stockfish package not found; skipping. Run `npm install` first.',
  )
  process.exit(0)
}

mkdirSync(outDir, { recursive: true })

let copied = 0
for (const file of files) {
  const from = join(srcDir, file)
  const to = join(outDir, file)
  if (!existsSync(from)) {
    console.warn(`[copy-engine] missing ${file}, skipping`)
    continue
  }
  copyFileSync(from, to)
  copied++
}

console.log(`[copy-engine] copied ${copied} file(s) to public/stockfish/`)
