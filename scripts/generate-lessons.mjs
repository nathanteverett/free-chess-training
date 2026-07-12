// Generates one MDX lesson stub per entry in the "78-module beginner-to-master
// sequence" from comprehensive_chess_curriculum.md. Run once with `npm run
// generate-lessons`. It is IDEMPOTENT: it never overwrites an existing lesson
// file, so re-running after you have edited a lesson is safe.
//
// Each generated file has YAML frontmatter (slug/title/module/stage/order/
// summary/youtubeId/puzzleIds/games) plus a starter article body for you to
// replace with your real content.
import { mkdirSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'src', 'content', 'lessons')

// Module name here MUST match a `name` in src/content/curriculum.ts.
const groups = [
  {
    module: 'Beginner pathway',
    stage: 'Stage A–C',
    prefix: 'b',
    titles: [
      'Board orientation, coordinates, setup, and piece names',
      'Rook, bishop, queen, and knight movement and capture',
      'King movement, attacked squares, check, and legal responses',
      'Pawns, two-square moves, capture, en passant, and promotion',
      'Castling and every condition that makes it legal or illegal',
      'Checkmate, stalemate, resignation, time, and basic draw rules',
      'Algebraic notation and game recording',
      'Mate in one, escape-square counting, and ladder mate',
      'King-and-queen and king-and-rook mating technique',
      'Material values, attackers, defenders, and safe exchanges',
      'Hanging pieces and the checks-captures-threats scan',
      'Forks, pins, skewers, and double attacks',
      'Discovered attacks, removal of defender, and back-rank tactics',
      'Center, development, king safety, and connecting rooks',
      'Starter opening positions and common opening traps',
      'King activity, rule of square, opposition, and key squares',
      'Open files, outposts, weak pawns, and improving the worst piece',
      'Complete slow game, independent review, and beginner graduation test',
    ],
  },
  {
    module: 'Tactical and technical foundations',
    stage: 'Modules 1–10',
    prefix: 'm',
    titles: [
      'Board safety, opponent threats, and blunder checks',
      'Checks, captures, threats, and candidate moves',
      'Forks, double attacks, and loose pieces',
      'Pins, skewers, x-rays, and alignments',
      'Discoveries, double checks, and batteries',
      'Removal, deflection, attraction, and overloading',
      'Clearance, interference, blocking, and zwischenzug',
      'Back-rank, smothered, corridor, and battery mates',
      'Fundamental king attacks and Greek Gift conditions',
      'Defensive tactics, simplification, perpetual check, and stalemate',
    ],
  },
  {
    module: 'Calculation and attacking play',
    stage: 'Modules 11–20',
    prefix: 'm',
    titles: [
      'Candidate generation and calculation trees',
      'Visualization and board reconstruction',
      "Opponent's best defense and refutation discipline",
      'Quiet moves and non-forcing calculation',
      'Calculation under time constraints',
      'Preconditions for a successful attack',
      'Opening lines against an uncastled king',
      'Same-side castling attacks and rook lifts',
      'Opposite-side castling and pawn storms',
      'Sacrifice, compensation, and transition out of the attack',
    ],
  },
  {
    module: 'Positional chess',
    stage: 'Modules 21–30',
    prefix: 'm',
    titles: [
      'Complete position evaluation',
      'Open, closed, fixed, and fluid centers',
      'Weak pawns and weak squares',
      'Outposts, color complexes, and restriction',
      'Good bishop, bad bishop, bishop pair, and knights',
      'Rook activity and major-piece coordination',
      'Favorable exchanges and material imbalances',
      'Pawn breaks and structural transformation',
      'Prophylaxis and opponent-plan detection',
      'Two weaknesses and technical conversion',
    ],
  },
  {
    module: 'Pawn structures and openings',
    stage: 'Modules 31–40',
    prefix: 'm',
    titles: [
      "Isolated queen's pawn",
      'Hanging pawns and Panov structures',
      'Carlsbad and minority attack',
      'French and Caro-Kann chains',
      'Open Sicilian and Maroczy Bind',
      "King's Indian and Benoni structures",
      'Hedgehog and English structures',
      'Repertoire construction and model games',
      'Move orders, transpositions, and sidelines',
      'Database, engine, and personal-file workflow',
    ],
  },
  {
    module: 'Endgames',
    stage: 'Modules 41–50',
    prefix: 'm',
    titles: [
      'King activity, opposition, and key squares',
      'Pawn races, breakthroughs, and triangulation',
      'Fundamental checkmates and minor-piece mate',
      'Lucena, Philidor, and cutting off the king',
      'Short-side, Vancura, frontal, and side-check defense',
      'Practical multi-pawn rook endings',
      'Same-colored and opposite-colored bishop endings',
      'Knight endings and bishop-versus-knight endings',
      'Queen endings and perpetual-check geometry',
      'Mixed material, fortresses, and endgame transitions',
    ],
  },
  {
    module: 'Competitive mastery',
    stage: 'Modules 51–60',
    prefix: 'm',
    titles: [
      'Independent game analysis',
      'Error taxonomy and training-plan design',
      'Clock management and practical decisions',
      'Active and passive defense',
      'Opponent preparation',
      'Opening novelty research and sparring',
      'Tournament psychology and recovery',
      'Technical conversion against resistance',
      'Event simulation and performance audit',
      'Individual master cycle and title planning',
    ],
  },
]

// Seed a few lessons with real puzzles and famous master games so the app
// demonstrates every feature end-to-end out of the box. Keyed by slug.
const OPERA_GAME = {
  label: "Morphy's Opera Game (Paris, 1858)",
  url: 'https://en.wikipedia.org/wiki/Opera_Game',
  note: 'A model attacking game: rapid development, pins, and a finishing sacrifice.',
}
const IMMORTAL_GAME = {
  label: 'The Immortal Game — Anderssen vs Kieseritzky (1851)',
  url: 'https://en.wikipedia.org/wiki/Immortal_Game',
  note: 'Romantic-era sacrifices culminating in a forced mate.',
}

const overrides = {
  'b12-forks-pins-skewers-double': {
    puzzleIds: ['knight-fork-queen', 'queen-double-attack'],
    games: [OPERA_GAME, IMMORTAL_GAME],
  },
  'b13-discovered-attacks-removal-defender': {
    puzzleIds: ['backrank-mate-1'],
    games: [OPERA_GAME],
  },
  'm03-forks-double-attacks-loose': {
    puzzleIds: ['knight-fork-queen', 'queen-double-attack'],
  },
  'm08-back-rank-smothered-corridor-battery': {
    puzzleIds: ['backrank-mate-1'],
  },
}

const STOPWORDS = new Set([
  'and',
  'the',
  'of',
  'a',
  'to',
  'with',
  'versus',
  'vs',
  'in',
  'for',
])

function slugify(title, maxWords = 4) {
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/\s+/)
    .filter((w) => w && !STOPWORDS.has(w))
  return words.slice(0, maxWords).join('-')
}

/** Split a title into individual concept items for the "What you'll learn" list. */
function conceptItems(title) {
  return title
    .replace(/\band\b/g, ',')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
}

function yamlList(items, indent = '  ') {
  return items
    .map(
      (g) =>
        `${indent}- label: ${JSON.stringify(g.label)}\n` +
        `${indent}  url: ${JSON.stringify(g.url)}\n` +
        (g.note ? `${indent}  note: ${JSON.stringify(g.note)}\n` : ''),
    )
    .join('')
    .replace(/\n$/, '')
}

mkdirSync(outDir, { recursive: true })

let order = 0
let moduleNum = 0 // continuous 1..60 across the numbered groups
let created = 0
let skipped = 0

for (const group of groups) {
  const isBeginner = group.prefix === 'b'
  group.titles.forEach((title, i) => {
    order += 1
    const codeNum = isBeginner ? i + 1 : (moduleNum += 1)
    const code = `${group.prefix}${String(codeNum).padStart(2, '0')}`
    const slug = `${code}-${slugify(title)}`
    const file = join(outDir, `${slug}.mdx`)

    if (existsSync(file)) {
      skipped += 1
      return
    }

    const ov = overrides[slug] ?? {}
    const puzzleIds = ov.puzzleIds ?? []
    const games = ov.games ?? []
    const concepts = conceptItems(title)

    const frontmatter =
      `---\n` +
      `slug: ${slug}\n` +
      `title: ${JSON.stringify(title)}\n` +
      `module: ${JSON.stringify(group.module)}\n` +
      `stage: ${JSON.stringify(group.stage)}\n` +
      `order: ${order}\n` +
      `summary: ${JSON.stringify(title + '.')}\n` +
      `youtubeId: ""\n` +
      `puzzleIds: [${puzzleIds.map((p) => JSON.stringify(p)).join(', ')}]\n` +
      (games.length
        ? `games:\n${yamlList(games)}\n`
        : `games: []\n`) +
      `---\n`

    const body =
      `\n## Overview\n\n` +
      `${title}. This lesson belongs to the **${group.module}** module ` +
      `(${group.stage}).\n\n` +
      `## What you'll learn\n\n` +
      concepts.map((c) => `- ${c}`).join('\n') +
      `\n\n## Article\n\n` +
      `> Starter outline — replace this with your full written lesson. ` +
      `Add a video by setting \`youtubeId\` in the frontmatter above, attach ` +
      `practice puzzles via \`puzzleIds\`, and link grandmaster games via ` +
      `\`games\`.\n\n` +
      `## Practice\n\n` +
      `Work through the puzzles below to drill this idea, watch the lesson ` +
      `video, then study the linked master games to see the concept in real ` +
      `play. Use the engine to check your own analysis.\n`

    writeFileSync(file, frontmatter + body, 'utf8')
    created += 1
  })
}

const total = readdirSync(outDir).filter((f) => f.endsWith('.mdx')).length
console.log(
  `[generate-lessons] created ${created}, skipped ${skipped} existing; ` +
    `${total} lesson file(s) total in src/content/lessons/`,
)
