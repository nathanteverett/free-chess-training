// Headless smoke test: drives the running dev server (http://localhost:5173)
// to verify the app renders, Stockfish runs in-browser, puzzles/hints work, and
// progress persists. Run the dev server first, then: node scripts/smoke.mjs
import { chromium } from '@playwright/test'

const BASE = process.env.BASE_URL || 'http://localhost:5173'
const SHOTS = process.env.SHOT_DIR || '.'
const LESSON = 'tactics-knight-forks'

const results = []
function check(name, ok, detail = '') {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`)
}

const browser = await chromium.launch()
const page = await browser.newPage()
page.on('pageerror', (e) => console.log('  [pageerror]', e.message))
page.on('console', (m) => {
  if (m.type() === 'error') console.log('  [console.error]', m.text())
})

try {
  // 1. Home renders the skill categories as collapsible dropdowns.
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: /Fundamentals/i }).waitFor({ timeout: 10000 })
  // Only the first category is expanded on load.
  const collapsedLinks = await page.locator('a[href^="/lesson/"]').count()
  check(
    'Categories start collapsed except the first',
    collapsedLinks > 0 && collapsedLinks < 60,
    `${collapsedLinks} lesson links visible`,
  )
  await page.getByRole('button', { name: /Expand all/i }).click()
  const lessonLinks = await page.locator('a[href^="/lesson/"]').count()
  check('Expand all reveals every lesson', lessonLinks === 181, `found ${lessonLinks}`)
  await page.screenshot({ path: `${SHOTS}/smoke-home.png`, fullPage: false })

  // 2. Lesson page: video + article + puzzle + games all render.
  await page.goto(`${BASE}/lesson/${LESSON}`, { waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: /Knight forks/i }).waitFor()
  const hasBoard = await page.locator('[data-square]').first().isVisible()
  check('Lesson puzzle board renders', hasBoard)
  const hasVideo = await page
    .getByRole('button', { name: /Play video/i })
    .isVisible()
  check('Curated lesson video renders', hasVideo)
  const gamesCount = await page.locator('a[href*="wikipedia.org"]').count()
  check('Grandmaster game links render', gamesCount >= 1, `${gamesCount} links`)

  // 3. Progressive hint reveals (first puzzle on the page).
  await page.getByRole('button', { name: /Show a hint/i }).first().click()
  const hintVisible = await page.getByText(/Hint 1:/i).first().isVisible()
  check('Puzzle hint reveals on demand', hintVisible)

  // 4. Progress persists across reload.
  await page.getByText(/Mark this lesson complete/i).click()
  await page.waitForTimeout(200)
  const stored = await page.evaluate(() =>
    window.localStorage.getItem('fct.progress.v1'),
  )
  check(
    'Progress written to localStorage',
    !!stored && stored.includes(LESSON),
    stored ?? 'null',
  )
  await page.reload({ waitUntil: 'networkidle' })
  const checkbox = page.locator('input[type="checkbox"]')
  const persisted = await checkbox.isChecked()
  check('Completion persists across reload', persisted)

  // 5. Stockfish runs in-browser on the analysis page (highest-risk integration).
  // Use domcontentloaded, not networkidle: the ~40 MB NNUE net download keeps
  // the network busy and networkidle would time out.
  await page.goto(`${BASE}/analysis`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: /Analysis board/i }).waitFor()
  // Wait until the engine reports a depth > 0 (proves the worker loaded the
  // wasm + NNUE net and is searching).
  let engineOk = false
  let depthText = ''
  for (let i = 0; i < 40; i++) {
    depthText = (await page.getByText(/depth \d+/).first().textContent()) || ''
    const m = depthText.match(/depth (\d+)/)
    if (m && Number(m[1]) > 0) {
      engineOk = true
      break
    }
    await page.waitForTimeout(500)
  }
  check('Stockfish produces an evaluation in-browser', engineOk, depthText)
  // The board should dominate the analysis page, with the info panels below it.
  const boardBox = await page.locator('[data-square]').first().boundingBox()
  const board = await page
    .locator('[data-boardid], [data-square]')
    .first()
    .evaluate((el) => {
      const b = el.closest('div[style*="width"]') ?? el
      return b.getBoundingClientRect().width
    })
  check(
    'Analysis board fills most of the viewport',
    board > 400,
    `board ~${Math.round(board)}px wide, square ${Math.round(boardBox?.width ?? 0)}px`,
  )
  await page.screenshot({ path: `${SHOTS}/smoke-analysis.png`, fullPage: false })

  await page.goto(`${BASE}/lesson/${LESSON}`)
  await page.getByRole('heading', { name: /Knight forks/i }).waitFor()
  await page.screenshot({ path: `${SHOTS}/smoke-lesson.png`, fullPage: true })
} catch (err) {
  check('Smoke run completed without exceptions', false, String(err))
} finally {
  await browser.close()
}

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)
