// Makes the built site survive a static host that has no server-side routing.
// Run automatically after `npm run build`.
//
// The app uses history-API routing, so /lesson/tactics-forks is a real URL the
// user can bookmark, share or reload — but there is no such file on disk. A
// static host asked for it returns its 404 page. GitHub Pages serves 404.html
// for any unmatched path, so shipping a copy of index.html under that name
// makes the router pick the route up client-side and the page loads normally.
//
// The .nojekyll file stops GitHub from running the build output through Jekyll,
// which would otherwise drop any file or directory whose name starts with "_".
import { copyFileSync, existsSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const index = join(dist, 'index.html')

if (!existsSync(index)) {
  console.error('[pages-fallback] dist/index.html not found — run `npm run build` first.')
  process.exit(1)
}

copyFileSync(index, join(dist, '404.html'))
writeFileSync(join(dist, '.nojekyll'), '')

console.log('[pages-fallback] wrote dist/404.html and dist/.nojekyll')
