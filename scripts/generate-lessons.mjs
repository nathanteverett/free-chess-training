// Generates one MDX lesson stub per TOPIC of the curriculum in
// comprehensive_chess_curriculum.md. Run with `npm run generate-lessons`.
//
// One lesson = one topic. Titles that used to bundle several ideas ("Forks,
// pins, skewers, and double attacks") are split so each idea gets its own
// lesson, video, and puzzle set.
//
// Lessons are filed under a SKILL CATEGORY (see src/content/curriculum.ts) —
// the skill the topic builds, not the rating band it was introduced at. So the
// pawn-structure topics land in `structures` and the mating-technique topics in
// `endgames`, wherever the source syllabus first mentioned them. Categories
// carry no stage/rating serialization.
//
// It is IDEMPOTENT: it never overwrites an existing lesson file, so re-running
// after you have edited a lesson is safe. Pass `--prune` to delete generated
// lesson files that are no longer in the topic list.
import {
  mkdirSync,
  writeFileSync,
  existsSync,
  readdirSync,
  unlinkSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'src', 'content', 'lessons')

// Each entry: [title, summary]. `category` MUST match an id in curriculum.ts.
const CATEGORIES = [
  {
    category: 'fundamentals',
    topics: [
      ['Board orientation and the light square rule', 'Set the board up the right way round: a light square goes in each player’s bottom-right corner.'],
      ['Files, ranks, and square names', 'Read any square on the board: files a–h, ranks 1–8, and the coordinate that names each square.'],
      ['The starting position', 'Place all sixteen pieces correctly, including the queen-on-her-own-color rule.'],
      ['The pieces and what they are worth', 'Name every piece and learn the rough point values used to compare them.'],
      ['How the rook moves and captures', 'The rook slides along ranks and files, capturing the first enemy piece in its path.'],
      ['How the bishop moves and captures', 'The bishop slides along diagonals and never leaves its starting color.'],
      ['How the queen moves and captures', 'The queen combines rook and bishop movement, making her the most powerful piece.'],
      ['How the knight moves and captures', 'The knight jumps in an L-shape, the only piece that can leap over others.'],
      ['How the king moves', 'The king steps one square in any direction — and can never move into check.'],
      ['Attacked squares', 'See which squares the opponent controls, and why the king may not walk onto one.'],
      ['Check and the three legal responses', 'When your king is attacked you must move it, block the check, or capture the checking piece.'],
      ['Pawn movement and the two-square first move', 'Pawns march forward one square, or two from their starting rank, and never move backward.'],
      ['Pawn captures', 'Pawns capture diagonally, which is why they cannot take the piece directly in front of them.'],
      ['En passant', 'The special pawn capture that answers a two-square pawn move, and the one-move window to play it.'],
      ['Pawn promotion and underpromotion', 'A pawn that reaches the last rank becomes any piece you choose — usually, but not always, a queen.'],
      ['Castling: kingside and queenside', 'The one move that shifts two pieces at once, tucking the king away and activating a rook.'],
      ['When castling is illegal', 'The five conditions — pieces moved, pieces between, in check, through check, into check — that forbid castling.'],
      ['Checkmate', 'The attacked king with no legal escape: the move that ends the game.'],
      ['Stalemate', 'No legal move and not in check is a draw, not a win — the most painful half point in chess.'],
      ['Draws: repetition, fifty-move rule, and insufficient material', 'The three rulebook draws every player needs to be able to claim.'],
      ['Resignation and draw offers', 'When to resign, how to offer a draw, and the etiquette around both.'],
      ['Clocks, time controls, and flagging', 'How a chess clock works, what the common time controls mean, and what happens when a flag falls.'],
      ['Algebraic notation', 'Write any move: piece letter, destination square, and the symbols for captures, check, and mate.'],
      ['Recording a game and reading a scoresheet', 'Keep an accurate scoresheet during play and replay a game from someone else’s.'],
    ],
  },
  {
    category: 'tactics',
    topics: [
      ['Mate in one', 'Train the pattern-recognition core: spot the single move that ends the game.'],
      ['Escape-square counting', 'Count every square the enemy king can run to — the habit that turns "check" into "checkmate".'],
      ['The ladder mate', 'Two rooks walk the king to the edge, one rank at a time. Your first forced mating technique.'],
      ['Material values and counting', 'Count material accurately so you always know whether a trade or a sacrifice is sound.'],
      ['Attackers and defenders', 'Count how many pieces hit a square versus how many guard it before you take.'],
      ['Safe exchanges', 'Decide whether a capture wins, loses, or is neutral before you commit to it.'],
      ['Hanging pieces', 'Undefended pieces are where most games are decided. Find them — yours and theirs.'],
      ['The checks, captures, threats scan', 'The three-step scan that catches most tactics and most blunders. Run it every move.'],
      ['Board safety and opponent threats', 'Before your own plan: what is my opponent threatening right now?'],
      ['Blunder checks', 'The final safety check between choosing a move and playing it.'],
      ['Candidate moves', 'Generate a short list of serious moves instead of latching onto the first one you see.'],
      ['Forks', 'One piece attacks two targets at once, and the opponent can only save one.'],
      ['Knight forks', 'The hardest fork to see coming, and the reason the knight punches above its weight.'],
      ['Double attacks', 'Create two threats with one move so that no single reply answers both.'],
      ['Loose pieces', 'Loose pieces drop off: undefended pieces are the raw material of nearly every tactic.'],
      ['Pins: absolute and relative', 'A pinned piece cannot move without exposing something more valuable behind it.'],
      ['Attacking a pinned piece', 'A pinned piece cannot run — so pile more attackers onto it.'],
      ['Skewers', 'The pin in reverse: hit the valuable piece first and win what stands behind it.'],
      ['X-rays', 'Attack (or defend) through a piece, so the threat activates the moment it moves.'],
      ['Alignments', 'Pieces on the same line are a tactic waiting to happen. Learn to spot the geometry first.'],
      ['Discovered attacks', 'Move one piece and unleash the piece behind it — two threats for the price of one move.'],
      ['Discovered check', 'The discovery that comes with check, so the opponent has no time to answer the other threat.'],
      ['Double check', 'Both pieces give check at once. The king MUST move — nothing else is legal.'],
      ['Batteries', 'Stack queen and rook, or queen and bishop, on one line to multiply their force.'],
      ['Removal of the defender', 'Take, chase, or trade the piece that is holding the opponent’s position together.'],
      ['Deflection', 'Force a defender away from the job it is doing.'],
      ['Attraction', 'Lure a piece — usually the king — onto a square where it can be hit.'],
      ['Overloading', 'A piece with two jobs can be made to fail at one of them.'],
      ['Clearance', 'Vacate a square or line, with tempo, so another piece can use it.'],
      ['Interference and blocking', 'Cut the line between a defender and the thing it defends.'],
      ['Zwischenzug', 'The in-between move: insert a bigger threat before making the "obvious" recapture.'],
      ['Back-rank mate', 'The king trapped behind its own pawns is the most common mate in practical chess.'],
      ['Smothered mate', 'The knight mates a king boxed in by its own pieces — usually after a queen sacrifice.'],
      ['Corridor and box mates', 'Mating a king confined to a file, rank, or pocket by its own pieces.'],
      ['Battery mates', 'Queen-and-rook and queen-and-bishop mating patterns against a weakened king.'],
      ['Defensive tactics', 'Tactics work for the defender too: counter-threats, in-between moves, and desperados.'],
      ['Simplification', 'Trade your way out of trouble: fewer pieces, fewer of the opponent’s threats.'],
      ['Perpetual check', 'When you are losing, an endless check is a full half point.'],
      ['Stalemate as a saving resource', 'Deliberately eliminate your own legal moves to escape a lost position.'],
    ],
  },
  {
    category: 'calculation',
    topics: [
      ['Building a calculation tree', 'Structure your thinking as a tree of candidate moves and replies instead of a random walk.'],
      ['Forcing moves first', 'Calculate checks, captures, and threats before anything else — they narrow the tree fastest.'],
      ['Visualization', 'Hold the position in your head and see the board as it will be, not as it is.'],
      ['Board reconstruction', 'Rebuild a position from memory. The training exercise that makes visualization reliable.'],
      ['Finding the opponent’s best defense', 'Calculate against your opponent’s strongest reply, not the one you hope they play.'],
      ['Refutation discipline', 'Try to break your own idea before you trust it. Most bad moves are unrefuted good ideas.'],
      ['Quiet moves', 'The strongest move in a forcing line is often the one that is not a check or a capture.'],
      ['Non-forcing calculation', 'How to calculate when nothing is forced and the tree will not close.'],
      ['Calculation under time pressure', 'Cut the tree honestly and pick a safe move when the clock will not let you finish.'],
      ['Preconditions for an attack', 'Attack only when the position earns it: space, targets, and more force than the defender.'],
      ['Opening lines against an uncastled king', 'Rip open the center when the enemy king is still sitting in it.'],
      ['Same-side castling attacks', 'Break down a castled king when your own king is on the same wing.'],
      ['Rook lifts', 'Swing a rook along the third or fourth rank to bring a heavy attacker to the kingside.'],
      ['Opposite-side castling attacks', 'When kings castle on opposite wings the game becomes a race. Learn to win it.'],
      ['Pawn storms', 'Throw your pawns at the enemy king when your own king is not in the blast radius.'],
      ['The Greek Gift', 'The Bxh7+ bishop sacrifice: the exact conditions that make it work, and when it fails.'],
      ['Sacrifices for the attack', 'Give up material to open lines, strip the king, or win time.'],
      ['Judging compensation', 'Decide whether the initiative you bought is really worth the material you paid.'],
      ['Transitioning out of an attack', 'When the attack stalls, cash it in for an endgame instead of burning it out.'],
    ],
  },
  {
    category: 'positional',
    topics: [
      ['Complete position evaluation', 'Assess a position by material, king safety, structure, activity, and space — in that order.'],
      ['Open centers', 'When the center pawns come off, piece activity and king safety decide everything.'],
      ['Closed centers', 'With the center locked, play shifts to the wings and the knights come into their own.'],
      ['Fixed centers', 'Fixed pawns create permanent targets and permanent squares. Both sides play around them.'],
      ['Fluid centers', 'The center is still undecided — the side that resolves it on their terms takes the advantage.'],
      ['Weak pawns: isolated, doubled, and backward', 'Learn to spot the three structural weaknesses and how to attack or defend them.'],
      ['Weak squares and holes', 'A square your pawns can never again defend is a permanent home for an enemy piece.'],
      ['Outposts', 'A protected knight on a hole in the opponent’s camp can be worth more than a rook.'],
      ['Color complexes', 'When one bishop disappears, every square of that color becomes a potential weakness.'],
      ['Restriction', 'Take squares away from enemy pieces until they have nothing to do.'],
      ['Good bishop, bad bishop', 'A bishop trapped behind its own pawns is a spectator. Free it or trade it.'],
      ['The bishop pair', 'Two bishops on an open board cover everything. Know when the pair is worth keeping.'],
      ['Bishop versus knight', 'Choose the right minor piece for the structure: open positions favor bishops, locked ones knights.'],
      ['Open files', 'Rooks belong on open files — that is how heavy pieces enter the position.'],
      ['The seventh rank', 'A rook on the seventh eats pawns and traps kings. Two of them usually win.'],
      ['Major-piece coordination', 'Double rooks, place the queen behind them, and pick a single target.'],
      ['Favorable exchanges', 'Every trade changes the character of the position. Trade toward your strengths.'],
      ['Material imbalances', 'Rook versus two minors, queen versus three pieces: how to play the lopsided material battles.'],
      ['Pawn breaks', 'The pawn move that opens the position at the moment that suits you and not your opponent.'],
      ['Structural transformation', 'Change the pawn structure deliberately, to create a target or kill a weakness.'],
      ['Prophylaxis', 'Ask what your opponent wants — then take it away before you do anything else.'],
      ['Detecting the opponent’s plan', 'Read the position from the other side of the board and predict the plan you must stop.'],
      ['The principle of two weaknesses', 'One weakness can be defended. Create a second one and the defense collapses.'],
      ['Technical conversion', 'Turn a clear advantage into a win without giving the opponent a single chance.'],
      ['Improving your worst piece', 'When you have no plan, find the piece doing the least and give it a job.'],
    ],
  },
  {
    category: 'structures',
    topics: [
      ['Control of the center', 'The first opening principle: the side that owns the center owns the game.'],
      ['Development', 'Get every piece off the back rank before you start anything. Do not move the same piece twice.'],
      ['King safety in the opening', 'Castle early. Most opening disasters are king-in-the-center disasters.'],
      ['Connecting the rooks', 'The moment your rooks see each other, your opening is finished and the middlegame begins.'],
      ['Choosing your first openings', 'Pick a small, coherent set of openings that teaches you good structures.'],
      ['Common opening traps', 'Know the traps that decide club games — from both sides of the board.'],
      ['The isolated queen’s pawn: attacking side', 'The IQP gives you space, open files, and the e5/d5 squares. Play fast and attack.'],
      ['The isolated queen’s pawn: blockading side', 'Blockade the pawn on d5, trade pieces, and win the endgame.'],
      ['Hanging pawns', 'Two abreast pawns are strong when they advance and weak when they are frozen.'],
      ['Panov structures', 'The Panov IQP structures and the plans that come with them.'],
      ['The Carlsbad structure', 'The classic Queen’s Gambit skeleton, and the three plans available to each side.'],
      ['The minority attack', 'Advance two pawns against three to manufacture a permanent weakness.'],
      ['French pawn chains', 'The locked chain: attack it at its base and play on the wing your chain points to.'],
      ['Caro-Kann structures', 'Solid, resilient structures where Black concedes space to keep a healthy skeleton.'],
      ['The Open Sicilian', 'Asymmetric structures, opposite-wing play, and the sharpest battleground in chess.'],
      ['The Maroczy Bind', 'The c4/e4 space-grab that squeezes Black, and how Black breaks free with ...b5 or ...d5.'],
      ['King’s Indian structures', 'The locked center where White storms the queenside and Black mates on the kingside.'],
      ['Benoni structures', 'Trade space for the long diagonal, the half-open e-file, and a queenside pawn majority.'],
      ['The Hedgehog', 'Coil behind the third rank, then uncoil with ...b5 or ...d5 at the right moment.'],
      ['English structures', 'Reversed Sicilians and flank play: the same patterns with an extra tempo.'],
      ['Repertoire construction', 'Build a repertoire that is small, connected, and made of structures you actually understand.'],
      ['Model games', 'Learn an opening from the games that define it, not from a move list.'],
      ['Move orders and transpositions', 'Reach your positions by the safest route, and recognize when you have been transposed.'],
      ['Handling sidelines', 'Meet offbeat openings with principles instead of memory.'],
      ['Database workflow', 'Search, filter, and study games so your prep is grounded in what people actually play.'],
      ['Engine use in opening prep', 'Use the engine to check ideas — not to memorize lines you do not understand.'],
      ['Keeping a personal opening file', 'Maintain a living file of your lines, your novelties, and your own mistakes.'],
    ],
  },
  {
    category: 'endgames',
    topics: [
      ['King and queen versus king', 'The first mate every player must be able to deliver, without stalemating.'],
      ['King and rook versus king', 'The box method: shrink the king’s area until it has nowhere left to stand.'],
      ['King activity', 'In the endgame the king is a strong piece. Centralize it before anything else.'],
      ['The rule of the square', 'Tell at a glance whether a king can catch a passed pawn — no counting moves required.'],
      ['Opposition', 'The king battle: the player NOT having to move is the one winning the fight.'],
      ['Distant opposition', 'Opposition from far away, and the parity rule that decides who gets it.'],
      ['Key squares', 'The squares your king must reach to force a pawn through, whatever the opponent does.'],
      ['Triangulation', 'Lose a tempo on purpose to hand the opponent a zugzwang they cannot escape.'],
      ['Pawn races', 'Count the race accurately, and check for the queen-with-check that decides it.'],
      ['Breakthroughs', 'Sacrifice a pawn — or two — to force a passer through a wall of pawns.'],
      ['Fundamental minor-piece mate: two bishops', 'Drive the king to a corner with two bishops and a king.'],
      ['Bishop and knight mate', 'The hardest fundamental mate: force the king to the corner your bishop controls.'],
      ['The Lucena position', 'The winning rook endgame technique. Build a bridge and promote the pawn.'],
      ['The Philidor position', 'The drawing rook endgame technique. Hold the third rank, then check from behind.'],
      ['Cutting off the king', 'A rook that cuts the enemy king off from the pawn does most of the winning for you.'],
      ['Short-side defense', 'Keep your king on the short side and check from the long side to draw.'],
      ['The Vancura defense', 'The active-rook draw against a rook-pawn that Philidor cannot save.'],
      ['Frontal defense and side checks', 'Two more rook-endgame drawing methods, and when each one applies.'],
      ['Practical multi-pawn rook endings', 'Real rook endings have pawns everywhere. Activity beats material almost every time.'],
      ['Same-colored bishop endings', 'Put your pawns on the opposite color to your bishop, and target theirs.'],
      ['Opposite-colored bishop endings', 'Famously drawish — even two pawns up. Know when they still win.'],
      ['Knight endings', 'Knight endings behave like pawn endings. Zugzwang and the outside passer decide them.'],
      ['Bishop versus knight endings', 'Open board and pawns on both wings favors the bishop; a locked structure favors the knight.'],
      ['Queen endings', 'Checks are endless. Centralize the queen and shepherd the passed pawn.'],
      ['Perpetual-check geometry', 'Find the checking net that saves a lost queen endgame.'],
      ['Fortresses', 'A position that cannot be broken is a draw regardless of material.'],
      ['Mixed material endings', 'Queen versus two rooks, rook versus minor: the endings the books skip.'],
      ['Endgame transitions', 'The most important endgame skill: knowing which endgame to trade into.'],
    ],
  },
  {
    category: 'mastery',
    topics: [
      ['Playing a complete slow game', 'Put it all together at a long time control, with a scoresheet and no takebacks.'],
      ['Independent game analysis', 'Analyze your own game fully before you switch the engine on.'],
      ['Analyzing without an engine', 'The skill the engine erodes: finding the truth of a position yourself.'],
      ['Error taxonomy', 'Classify your mistakes — tactical, positional, clock, psychological — so you can train the real one.'],
      ['Designing a training plan', 'Build a weekly plan around your actual weaknesses instead of what is fun.'],
      ['Clock management', 'Spend time where the position is critical and move quickly where it is not.'],
      ['Practical decisions', 'Choosing the move you understand over the move that is objectively best.'],
      ['Active defense', 'Defend by creating counter-threats, not by sitting still.'],
      ['Passive defense', 'When you must hold, hold: minimize weaknesses and give the opponent nothing to attack.'],
      ['Opponent preparation', 'Study your opponent’s repertoire and habits before the round.'],
      ['Opening novelty research', 'Find and test a new idea in your own lines.'],
      ['Sparring and training games', 'Train positions by playing them out, not by reading about them.'],
      ['Tournament psychology', 'Nerves, tilt, and focus across a long event.'],
      ['Recovering from a loss', 'The next-round routine that stops one loss from becoming three.'],
      ['Technical conversion against resistance', 'Win won positions against an opponent who is fighting for every square.'],
      ['Event simulation', 'Rehearse a full tournament in training conditions before you play one.'],
      ['Performance audit', 'Review a whole event and extract the two or three things worth changing.'],
      ['The individual master cycle', 'The long-run loop: play, analyze, diagnose, train, repeat.'],
      ['Title planning', 'Set rating and norm goals, and pick the events that can actually deliver them.'],
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
  'tactics-forks': { puzzleIds: ['knight-fork-queen'] },
  'tactics-knight-forks': {
    puzzleIds: ['knight-fork-queen'],
    games: [OPERA_GAME],
  },
  'tactics-double-attacks': { puzzleIds: ['queen-double-attack'] },
  'tactics-back-rank-mate': {
    puzzleIds: ['backrank-mate-1'],
    games: [OPERA_GAME],
  },
  'tactics-pins-absolute-relative': { games: [OPERA_GAME] },
  'calculation-sacrifices-attack': { games: [IMMORTAL_GAME] },
}

const STOPWORDS = new Set([
  'and',
  'the',
  'of',
  'a',
  'an',
  'to',
  'with',
  'versus',
  'vs',
  'in',
  'for',
  'is',
  'are',
])

function slugify(title, maxWords = 4) {
  const words = title
    .toLowerCase()
    // Strip apostrophes (typographic and straight) rather than turning them
    // into separators, so "queen's" slugs to "queens" not "queen-s".
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter((w) => w && !STOPWORDS.has(w))
  return words.slice(0, maxWords).join('-')
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

const prune = process.argv.includes('--prune')
let order = 0
let created = 0
let skipped = 0
const expected = new Set()
const seenSlugs = new Map()

for (const group of CATEGORIES) {
  for (const [title, summary] of group.topics) {
    order += 1
    const slug = `${group.category}-${slugify(title)}`

    if (seenSlugs.has(slug)) {
      throw new Error(
        `Duplicate slug "${slug}" from "${title}" and "${seenSlugs.get(slug)}". ` +
          `Reword one of the topics.`,
      )
    }
    seenSlugs.set(slug, title)
    expected.add(`${slug}.mdx`)

    const file = join(outDir, `${slug}.mdx`)
    if (existsSync(file)) {
      skipped += 1
      continue
    }

    const ov = overrides[slug] ?? {}
    const puzzleIds = ov.puzzleIds ?? []
    const games = ov.games ?? []

    const frontmatter =
      `---\n` +
      `slug: ${slug}\n` +
      `title: ${JSON.stringify(title)}\n` +
      `category: ${JSON.stringify(group.category)}\n` +
      `order: ${order}\n` +
      `summary: ${JSON.stringify(summary)}\n` +
      `youtubeId: ""\n` +
      `puzzleIds: [${puzzleIds.map((p) => JSON.stringify(p)).join(', ')}]\n` +
      (games.length ? `games:\n${yamlList(games)}\n` : `games: []\n`) +
      `---\n`

    const body =
      `\n## Overview\n\n` +
      `${summary}\n\n` +
      `## Article\n\n` +
      `> Starter outline — replace this with your full written lesson. The ` +
      `lesson video is resolved automatically from the curated library in ` +
      `\`src/content/videos.ts\`; set \`youtubeId\` above to override it. Attach ` +
      `practice puzzles via \`puzzleIds\` and link master games via \`games\`.\n\n` +
      `## Practice\n\n` +
      `Work through the puzzles below to drill this idea, watch the lesson ` +
      `video, then study the linked master games to see the concept in real ` +
      `play. Use the engine to check your own analysis.\n`

    writeFileSync(file, frontmatter + body, 'utf8')
    created += 1
  }
}

let pruned = 0
if (prune) {
  for (const f of readdirSync(outDir).filter((f) => f.endsWith('.mdx'))) {
    if (!expected.has(f)) {
      unlinkSync(join(outDir, f))
      pruned += 1
    }
  }
}

const total = readdirSync(outDir).filter((f) => f.endsWith('.mdx')).length
console.log(
  `[generate-lessons] created ${created}, skipped ${skipped} existing` +
    (prune ? `, pruned ${pruned} stale` : '') +
    `; ${total} lesson file(s) total in src/content/lessons/`,
)
