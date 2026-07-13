// Imports themed puzzles from the Lichess open puzzle database (CC0) into
// src/content/puzzles/generated.ts. Run with `npm run import-puzzles`.
//
// This is a manual, occasional refresh — NOT part of the build. The source file
// is ~300 MB compressed and several GB decompressed, so it is streamed, filtered
// down to a few puzzles per lesson, and only the generated TypeScript is
// committed. The site itself never touches the network for puzzles.
//
//   1. Download https://database.lichess.org/lichess_db_puzzle.csv.zst into
//      .cache/ (gitignored). Pass --download to fetch it automatically.
//   2. Stream-decompress it and keep, per lesson, the highest-quality puzzles
//      whose themes match that lesson's query in puzzle-queries.mjs.
//   3. Convert each row to our Puzzle shape and write generated.ts.
//
// A row's FEN is the position BEFORE the opponent's blunder, and the first
// listed move is that blunder. Our Puzzle.solution starts with the SOLVER, so
// the first move is played onto the FEN and the resulting position is stored.
import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { createInterface } from 'node:readline'
import { pipeline } from 'node:stream/promises'
import { createZstdDecompress } from 'node:zlib'
import { Readable, Transform } from 'node:stream'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Chess } from 'chess.js'
import {
  CATEGORY_FALLBACK,
  CATEGORY_RATING,
  PUZZLES_PER_LESSON,
  QUERIES,
} from './puzzle-queries.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const cacheDir = join(root, '.cache')
const dbPath = join(cacheDir, 'lichess_db_puzzle.csv.zst')
const outPath = join(root, 'src', 'content', 'puzzles', 'generated.ts')
const DB_URL = 'https://database.lichess.org/lichess_db_puzzle.csv.zst'

// Quality floors. RatingDeviation is Glicko uncertainty: a high value means the
// rating is a guess from too few plays, so the difficulty band is meaningless.
const MAX_RATING_DEVIATION = 100
const MIN_POPULARITY = 85
const MIN_PLAYS = 200

/**
 * Candidates kept per lesson while streaming. This must be much larger than
 * PUZZLES_PER_LESSON: lessons that share a motif (six fundamentals lessons all
 * want mateIn1) build near-identical pools, and because a puzzle is assigned to
 * only one lesson, a shallow pool starves whichever lesson is resolved last.
 */
const POOL_PER_LESSON = PUZZLES_PER_LESSON * 40

/**
 * Tags that describe a puzzle's phase, length or provenance rather than its
 * motif. The motif — what the learner has to *see* — is whatever is left.
 */
const NON_MOTIF = new Set([
  'opening', 'middlegame', 'endgame',
  'oneMove', 'short', 'long', 'veryLong',
  'crushing', 'advantage', 'equality', 'mate',
  'master', 'masterVsMaster', 'superGM', 'playerGames', 'mix',
])

/** Motif → the general "where to look" hint and the sentence explaining it. */
const MOTIF = {
  fork: ['One move can attack two things at once. Which piece can hit both?', 'a fork — a single piece attacking two targets at the same time, so only one of them can be saved'],
  pin: ['Something is stuck in front of a more valuable piece behind it.', 'a pin — a defender cannot move without exposing the more valuable piece behind it, so it can be attacked again and again'],
  skewer: ['A valuable piece is in front, and something worth taking is directly behind it.', 'a skewer — the valuable piece is attacked through, and when it steps aside the piece behind it falls'],
  xRayAttack: ['Look straight through a piece along the line it stands on.', 'an X-ray — the attack works through an intervening piece, along the line beyond it'],
  backRankMate: ['Count the king’s escape squares. Are its own pawns in the way?', 'a back-rank mate — the king is boxed in by its own pawns and a major piece lands on the empty rank behind them'],
  smotheredMate: ['The enemy king is surrounded — but by its own pieces.', 'a smothered mate — the king is hemmed in by its own men and a knight delivers mate it cannot capture or block'],
  doubleCheck: ['Can you check with two pieces at once? The king would have to move.', 'a double check — two pieces give check at once, so nothing can be captured or blocked and the king is forced to move'],
  discoveredCheck: ['Moving one piece could uncover an attack from the piece behind it.', 'a discovered check — moving one piece unleashes check from the piece behind it, so the mover is free to do damage of its own'],
  discoveredAttack: ['Moving one piece could uncover an attack from the piece behind it.', 'a discovered attack — moving one piece unleashes the piece behind it, so two threats appear from a single move'],
  deflection: ['A defender is doing a job. Can you force it to go somewhere else?', 'a deflection — a defender is forced away from the job it was doing, and what it was guarding falls'],
  attraction: ['Can you force an enemy piece onto a square where it becomes a target?', 'an attraction — a piece (usually the king) is lured onto a square where it can be hit by a follow-up'],
  capturingDefender: ['Something is defended. What is defending it?', 'removing the defender — the piece holding everything together is captured or driven off, and the position collapses behind it'],
  interference: ['Two enemy pieces defend along the same line. Can you get between them?', 'an interference — a piece is placed between a defender and what it defends, cutting the line'],
  clearance: ['One of your own pieces is standing in the way of the real threat.', 'a clearance — one of your own pieces vacates the square or line the real threat needs'],
  intermezzo: ['Before recapturing, is there something more forcing?', 'an in-between move — instead of the expected recapture, a more forcing move comes first and changes the whole line'],
  quietMove: ['Not every winning move is a check or a capture.', 'a quiet move — no check, no capture, just an unanswerable threat that the opponent cannot meet'],
  sacrifice: ['Material is not the point here. What does giving something up buy you?', 'a sacrifice — material is given up because the resulting attack is worth more than the piece'],
  hangingPiece: ['Scan every enemy piece. Is one of them undefended?', 'a hanging piece — something is left undefended, and it can simply be taken'],
  trappedPiece: ['An enemy piece has wandered. Can it get back?', 'a trapped piece — an enemy piece has no safe squares, so it can be hunted down'],
  zugzwang: ['The opponent is fine right now — but they have to move.', 'zugzwang — the opponent is not threatened, but every legal move worsens their position'],
  advancedPawn: ['A pawn is close to the end of the board.', 'an advanced pawn — the pawn is close enough to promote that stopping it costs material'],
  promotion: ['A pawn is close to the end of the board.', 'a promotion — the pawn queens, or the threat to queen wins material'],
  underPromotion: ['A new queen is not always the best new piece.', 'an underpromotion — a queen would fail, so the pawn becomes the piece the position actually needs'],
  enPassant: ['A pawn just moved two squares past yours.', 'an en passant capture — the pawn that tried to slip past is taken as if it had moved one square'],
  castling: ['The king is not yet safe.', 'castling — the king reaches safety and the rook joins the game in a single move'],
  defensiveMove: ['You are the one under threat. What is the threat, exactly?', 'a defensive move — the opponent’s threat is met precisely, and only one move does it'],
  exposedKing: ['The enemy king has no cover.', 'an exposed king — the king has been stripped of shelter, and the attack goes through'],
  kingsideAttack: ['The enemy king is castled kingside. What is aimed at it?', 'a kingside attack — the pieces converge on the castled king and break through'],
  queensideAttack: ['The enemy king is on the queenside. What is aimed at it?', 'a queenside attack — the pieces converge on the king’s side of the board and break through'],
  attackingF2F7: ['The f2/f7 square is defended only by the king.', 'an attack on the weakest square in the opening — f2 or f7, defended by the king alone'],
  pawnEndgame: ['Kings and pawns only. The king is a fighting piece here.', 'a pawn endgame, where king activity and a single tempo decide the result'],
  rookEndgame: ['Rooks belong behind passed pawns — yours and theirs.', 'a rook endgame, where activity matters more than a pawn'],
  knightEndgame: ['Knights are slow. Count the moves.', 'a knight endgame, where the knight’s slowness decides who arrives first'],
  bishopEndgame: ['Watch the colour the bishop travels on.', 'a bishop endgame, decided by the squares the bishop can and cannot reach'],
  queenEndgame: ['Watch for checks — from both sides.', 'a queen endgame, where perpetual check is always one loose square away'],
  queenRookEndgame: ['Major pieces. Watch both kings’ safety at once.', 'a queen-and-rook endgame, where the first king to get exposed usually loses'],
  anastasiaMate: ['Knight and rook, against a king cut off on the edge.', 'Anastasia’s mate — a knight takes the escape squares and a rook mates along the edge'],
  arabianMate: ['Knight and rook, against a king in the corner.', 'the Arabian mate — knight and rook cover the corner between them'],
  bodenMate: ['Two bishops on crossing diagonals.', 'Boden’s mate — two bishops criss-cross onto a king that its own pieces have boxed in'],
  doubleBishopMate: ['Two bishops on neighbouring diagonals.', 'a double-bishop mate — the two bishops cover the king’s escape squares together'],
  hookMate: ['Rook, knight and pawn, working as one net.', 'a hook mate — rook, knight and pawn form a net the king cannot leave'],
  killBoxMate: ['A rook and a queen, boxing the king in.', 'a kill-box mate — rook and queen build a box the king cannot step out of'],
  vukovicMate: ['Rook and knight, with the king cut off.', 'Vuković’s mate — the rook mates while the knight covers the flight squares'],
  dovetailMate: ['The king’s own pieces take away its escape squares.', 'a dovetail mate — the king’s own men block the very squares it needs'],
  epauletteMate: ['The king is flanked by its own rooks.', 'an épaulette mate — the king’s own rooks stand on the squares it would flee to'],
  cornerMate: ['The king is in the corner.', 'a corner mate, where the king’s own pieces leave it nowhere to go'],
  mateIn1: ['The king has no escape. One move ends it.', 'a mate in one — every escape square is already covered'],
  mateIn2: ['The king is in a net. Look only at checks.', 'a forced mate — the first check takes away the last escape square, and mate follows'],
  mateIn3: ['The king is in a net. Look only at checks.', 'a forced mate — each check is forced, and the king runs out of squares'],
  mateIn4: ['The king is in a net. Look only at checks.', 'a forced mate — a long forcing sequence the opponent cannot step out of'],
  mateIn5: ['The king is in a net. Look only at checks.', 'a forced mate — a long forcing sequence the opponent cannot step out of'],
  // Used when a puzzle carries only phase/length tags and no motif of its own.
  calculation: [
    'Calculate the forcing line all the way to the end before you commit to the first move.',
    'a forcing sequence — the first move only works because every reply has been calculated to the end',
  ],
}

const PIECE_NAME = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' }

// ---------------------------------------------------------------------------

/**
 * The Lichess file is written by pzstd: pairs of a 12-byte *skippable* frame
 * (magic 0x184D2A50, whose 4-byte payload is the next frame's compressed size)
 * and a real zstd frame. Node's decompressor handles concatenated real frames
 * but rejects the skippable ones ("Unknown frame descriptor"), so strip them
 * here. A plain single-frame .zst passes straight through untouched.
 */
const SKIPPABLE_MAGIC = 0x184d2a50
const SKIPPABLE_HEADER = 12

function stripSkippableFrames() {
  let held = Buffer.alloc(0) // partial header awaiting more bytes
  let remaining = 0 // bytes left in the real frame being passed through
  let passthrough = false // not a pzstd container after all

  return new Transform({
    transform(chunk, _encoding, done) {
      if (passthrough) return done(null, chunk)
      let buf = held.length > 0 ? Buffer.concat([held, chunk]) : chunk
      held = Buffer.alloc(0)
      const out = []

      while (buf.length > 0) {
        if (remaining > 0) {
          const take = Math.min(remaining, buf.length)
          out.push(buf.subarray(0, take))
          remaining -= take
          buf = buf.subarray(take)
          continue
        }
        if (buf.length < SKIPPABLE_HEADER) {
          held = buf // need more bytes to read the next header
          break
        }
        if (buf.readUInt32LE(0) !== SKIPPABLE_MAGIC) {
          passthrough = true
          out.push(buf)
          break
        }
        remaining = buf.readUInt32LE(8)
        buf = buf.subarray(SKIPPABLE_HEADER)
      }

      done(null, out.length > 0 ? Buffer.concat(out) : undefined)
    },
  })
}

/** Every lesson slug and its category, read from the MDX frontmatter. */
function readLessons() {
  const dir = join(root, 'src', 'content', 'lessons')
  return readdirSync(dir)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => {
      const raw = readFileSync(join(dir, f), 'utf8')
      const category = raw.match(/^category:\s*["']?([\w-]+)["']?\s*$/m)?.[1]
      const title = raw.match(/^title:\s*["'](.+)["']\s*$/m)?.[1]
      const slug = f.replace(/\.mdx$/, '')
      if (!category) throw new Error(`${f}: no category in frontmatter`)
      return { slug, category, title: title ?? slug }
    })
}

/** Resolve a lesson to its query, falling back to the category default. */
function queryFor(lesson) {
  const query = QUERIES[lesson.slug] ?? CATEGORY_FALLBACK[lesson.category]
  if (!query) throw new Error(`${lesson.slug}: no query and no fallback for "${lesson.category}"`)
  const rating = query.rating ?? CATEGORY_RATING[lesson.category]
  return { ...query, rating, any: query.any ?? [], all: query.all ?? [] }
}

function matches(query, themes) {
  for (const theme of query.all) if (!themes.has(theme)) return false
  if (query.any.length === 0) return true
  for (const theme of query.any) if (themes.has(theme)) return true
  return false
}

/** Primary motif of a puzzle: the first query theme it actually carries. */
function primaryMotif(query, themes) {
  for (const theme of query.any) if (themes.has(theme) && MOTIF[theme]) return theme
  for (const theme of themes) if (MOTIF[theme]) return theme
  for (const theme of themes) if (!NON_MOTIF.has(theme)) return theme
  return 'calculation'
}

async function download() {
  mkdirSync(cacheDir, { recursive: true })
  process.stdout.write(`Downloading ${DB_URL} …\n`)
  const response = await fetch(DB_URL)
  if (!response.ok) throw new Error(`download failed: HTTP ${response.status}`)
  await pipeline(Readable.fromWeb(response.body), createWriteStream(dbPath))
}

/**
 * Stream the database once, keeping a bounded pool of candidates per lesson.
 * One pass over ~6M rows; nothing but the pools is ever held in memory.
 */
async function collect(lessons) {
  const pools = new Map(lessons.map((l) => [l.slug, []]))
  const queries = new Map(lessons.map((l) => [l.slug, queryFor(l)]))

  const lines = createInterface({
    input: createReadStream(dbPath).pipe(stripSkippableFrames()).pipe(createZstdDecompress()),
    crlfDelay: Infinity,
  })

  let rows = 0
  let header = true
  for await (const line of lines) {
    if (header) { header = false; continue }
    if (!line) continue
    if (++rows % 500_000 === 0) process.stdout.write(`  … ${rows.toLocaleString()} rows\n`)

    // No field can contain a comma (FEN, UCI moves and space-separated themes),
    // so a plain split is safe here and far faster than a CSV parser.
    const [id, fen, moves, rating, deviation, popularity, plays, themeList, gameUrl] = line.split(',')

    if (Number(deviation) > MAX_RATING_DEVIATION) continue
    if (Number(popularity) < MIN_POPULARITY) continue
    if (Number(plays) < MIN_PLAYS) continue

    const score = Number(popularity) * 1000 + Math.min(Number(plays), 999)
    const themes = new Set(themeList.split(' ').filter(Boolean))
    const ratingValue = Number(rating)

    for (const [slug, query] of queries) {
      if (ratingValue < query.rating[0] || ratingValue > query.rating[1]) continue
      if (!matches(query, themes)) continue

      const pool = pools.get(slug)
      if (pool.length < POOL_PER_LESSON) {
        pool.push({ id, fen, moves, rating: ratingValue, score, themes, gameUrl })
        if (pool.length === POOL_PER_LESSON) pool.sort((a, b) => b.score - a.score)
      } else if (score > pool[pool.length - 1].score) {
        // Pool is full and sorted: replace the weakest, keep it sorted.
        pool[pool.length - 1] = { id, fen, moves, rating: ratingValue, score, themes, gameUrl }
        pool.sort((a, b) => b.score - a.score)
      }
    }
  }

  for (const pool of pools.values()) pool.sort((a, b) => (b.score - a.score) || (a.id < b.id ? -1 : 1))
  process.stdout.write(`Scanned ${rows.toLocaleString()} rows.\n`)
  return pools
}

/**
 * Convert one database row into our Puzzle shape, or null if the line does not
 * play out legally (a corrupt row should be dropped, not shipped).
 */
function toPuzzle(row, query, lesson) {
  const uci = row.moves.split(' ').filter(Boolean)
  if (uci.length < 2) return null

  const game = new Chess(row.fen)
  const play = (move) =>
    game.move({
      from: move.slice(0, 2),
      to: move.slice(2, 4),
      promotion: move.length > 4 ? move[4] : undefined,
    })

  // The first listed move is the opponent's blunder; the solver moves second.
  if (!play(uci[0])) return null
  const startFen = game.fen()
  const solution = uci.slice(1)

  // Walk the line to confirm legality and collect SAN for the hints and idea.
  const san = []
  const solverFirst = { piece: null, san: null, isCheck: false, isCapture: false, to: null }
  for (const [i, move] of solution.entries()) {
    const played = play(move)
    if (!played) return null
    san.push(played.san)
    if (i === 0) {
      solverFirst.piece = PIECE_NAME[played.piece]
      solverFirst.san = played.san
      solverFirst.isCheck = played.san.includes('+') || played.san.includes('#')
      solverFirst.isCapture = played.san.includes('x')
      solverFirst.to = played.to
    }
  }

  const motif = primaryMotif(query, row.themes)
  const [lookHint, motifPhrase] = MOTIF[motif] ?? [
    `Find the strongest move for the side to move.`,
    `a ${motif} motif`,
  ]

  // Hint 2 narrows to the piece without naming the move; hint 3 gives it away.
  const nature = solverFirst.isCheck
    ? ' It is a check.'
    : solverFirst.isCapture
      ? ` It is a capture, on ${solverFirst.to}.`
      : ' It is neither a check nor a capture.'
  const mateIn = ['mateIn1', 'mateIn2', 'mateIn3', 'mateIn4', 'mateIn5'].find((t) => row.themes.has(t))
  const mateNote = mateIn ? ` It forces mate in ${mateIn.slice(-1)}.` : ''

  const line = san
    .map((move, i) => (i % 2 === 0 ? `${Math.floor(i / 2) + 1}. ${move}` : move))
    .join(' ')

  return {
    id: `lichess-${row.id}`,
    fen: startFen,
    solution,
    theme: motif,
    idea: `The winning idea is ${motifPhrase}. The line runs ${line}.${mateNote}`,
    hints: [
      lookHint,
      `The key move is a ${solverFirst.piece} move.${nature}`,
      `Play ${solverFirst.san}.`,
    ],
    source: `Lichess puzzle ${row.id} (CC0) — https://lichess.org/training/${row.id}`,
    rating: row.rating,
    lesson: lesson.slug,
  }
}

/**
 * Assign puzzles to lessons, greedily and in a fixed order, so that no puzzle
 * appears under two lessons — ids must be globally unique for progress tracking.
 */
function assign(lessons, pools) {
  const taken = new Set()
  const byLesson = {}
  const thin = []

  for (const lesson of lessons) {
    const query = queryFor(lesson)
    const chosen = []
    for (const row of pools.get(lesson.slug)) {
      if (chosen.length >= PUZZLES_PER_LESSON) break
      if (taken.has(row.id)) continue
      const puzzle = toPuzzle(row, query, lesson)
      if (!puzzle) continue
      taken.add(row.id)
      chosen.push(puzzle)
    }
    // Easiest first, so a lesson's puzzle set ramps up in difficulty.
    chosen.sort((a, b) => a.rating - b.rating)
    byLesson[lesson.slug] = chosen
    if (chosen.length < PUZZLES_PER_LESSON) thin.push(`${lesson.slug} (${chosen.length})`)
  }
  return { byLesson, thin }
}

function render(lessons, byLesson) {
  const total = Object.values(byLesson).reduce((n, list) => n + list.length, 0)
  const body = lessons
    .map((lesson) => {
      const list = byLesson[lesson.slug]
      const entries = list
        .map(
          (p) => `    {
      id: ${JSON.stringify(p.id)},
      fen: ${JSON.stringify(p.fen)},
      solution: ${JSON.stringify(p.solution)},
      theme: ${JSON.stringify(p.theme)},
      rating: ${p.rating},
      idea: ${JSON.stringify(p.idea)},
      hints: [
${p.hints.map((h) => `        ${JSON.stringify(h)},`).join('\n')}
      ],
      source: ${JSON.stringify(p.source)},
    },`,
        )
        .join('\n')
      return `  ${JSON.stringify(lesson.slug)}: [\n${entries}\n  ],`
    })
    .join('\n')

  return `// GENERATED FILE — DO NOT EDIT BY HAND.
//
// Written by \`npm run import-puzzles\` from the Lichess open puzzle database,
// which is released into the public domain (CC0). Each puzzle links back to its
// original at lichess.org/training/<id>. To change what a lesson gets, edit its
// query in scripts/puzzle-queries.mjs and re-run the import.
//
// ${total} puzzles across ${lessons.length} lessons.
import type { Puzzle } from '../../types'

export const generatedPuzzles: Record<string, Puzzle[]> = {
${body}
}
`
}

// ---------------------------------------------------------------------------

if (process.argv.includes('--download') || !existsSync(dbPath)) {
  if (!existsSync(dbPath)) process.stdout.write('No cached database found.\n')
  await download()
}

const lessons = readLessons()
process.stdout.write(`Matching ${lessons.length} lessons against the puzzle database …\n`)

const pools = await collect(lessons)
const { byLesson, thin } = assign(lessons, pools)

await writeFile(outPath, render(lessons, byLesson), 'utf8')

const total = Object.values(byLesson).reduce((n, list) => n + list.length, 0)
process.stdout.write(`Wrote ${total} puzzles to src/content/puzzles/generated.ts\n`)

const empty = lessons.filter((l) => byLesson[l.slug].length === 0)
if (empty.length > 0) {
  process.stderr.write(`\n${empty.length} lesson(s) matched NO puzzles:\n`)
  for (const lesson of empty) process.stderr.write(`  ${lesson.slug}\n`)
  process.stderr.write('Loosen their query in scripts/puzzle-queries.mjs.\n')
  process.exit(1)
}
if (thin.length > 0) {
  process.stdout.write(`\n${thin.length} lesson(s) got fewer than ${PUZZLES_PER_LESSON}:\n`)
  for (const entry of thin) process.stdout.write(`  ${entry}\n`)
}
