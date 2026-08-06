# Authoring lessons

A lesson is a single MDX file in `src/content/lessons/`. It has **frontmatter**
(structured fields at the top) and an **article body** (Markdown/MDX below the
frontmatter). This guide covers how to write one, attach games and puzzles, and
add more puzzles.

## 1. Anatomy of a lesson file

**One lesson covers one topic.** Don't bundle several ideas into a lesson — a
title like "Forks, pins, and skewers" should be three lessons.

```mdx
---
slug: tactics-knight-forks               # unique; matches the file name
title: "Knight forks"                     # a single topic
category: "tactics"                       # must match an id in curriculum.ts
order: 37                                 # global ordering across all lessons
summary: "The hardest fork to see coming, and the reason the knight punches above its weight."
youtubeId: ""                            # reserved; leave empty for now
puzzleIds: ["knight-fork-queen"]         # ids from src/content/puzzles
games:
  - label: "Morphy's Opera Game (Paris, 1858)"
    url: "https://en.wikipedia.org/wiki/Opera_Game"
    note: "A model attacking game."
---

## Overview

Write the lesson article here in Markdown. You can use headings, lists,
**bold**, `code`, links, and — because this is MDX — even React components.
```

### Frontmatter fields

| Field       | Required | Notes                                                        |
| ----------- | -------- | ------------------------------------------------------------ |
| `slug`      | yes      | Unique; the URL is `/lesson/<slug>`. Keep it matching the filename. |
| `title`     | yes      | One topic. Shown as the page heading and in nav.             |
| `category`  | yes      | Must exactly match an `id` in `src/content/curriculum.ts`, e.g. `tactics`. |
| `order`     | yes      | Integer; lessons are sorted globally by this.                |
| `summary`   | yes      | One sentence; shown in the category list and at the top of the lesson. |
| `youtubeId` | no       | Reserved for an approved replacement video. Leave empty for now. |
| `puzzleIds` | no       | Array of puzzle ids (see below). Empty shows a note.         |
| `games`     | no       | List of `{ label, url, note? }`. Empty shows a note.         |

Categories are a **skill grouping, not a rating ladder** — they carry no stage or
rating band. File a lesson by the skill it builds, so a mating-technique topic
goes under `endgames` even if a beginner meets it first.

## 2. Reserved video section

Every lesson keeps a blank video section in the layout. The shared video map is
intentionally empty, and lesson `youtubeId` fields should remain empty until a
replacement video has been curated and approved. Blank sections contain no
player, thumbnail, search link, or external request.

## 3. Adding grandmaster games

Add entries under `games`. Any URL works (Lichess study, chessgames.com,
Wikipedia, etc.):

```yaml
games:
  - label: "Kasparov vs Topalov, Wijk aan Zee 1999"
    url: "https://lichess.org/study/…"
    note: "A famous king hunt."
```

## 4. Adding puzzles

Puzzles live in `src/content/puzzles/index.ts` as typed data, and lessons
reference them by `id`. Add a puzzle to the `puzzles` array:

```ts
{
  id: 'knight-fork-queen',                 // unique id, referenced by lessons
  fen: '3q3k/8/8/6N1/8/8/8/6K1 w - - 0 1', // starting position
  solution: ['g5f7', 'h8g8', 'f7d8'],      // UCI moves, solver first, alternating
  theme: 'fork',
  idea: 'The knight forks the king and queen on f7…',   // shown on solve
  hints: [                                  // revealed one at a time, general → specific
    'Your knight can hit two pieces at once.',
    'Find a knight move that gives check and hits the queen.',
    'Play Nf7+.',
  ],
  source: 'Curated example',                // optional attribution
}
```

Then reference it from a lesson: `puzzleIds: ["knight-fork-queen"]`.

### Solution format

- Moves are **UCI long algebraic**: from-square + to-square (+ promotion piece),
  e.g. `e2e4`, `e7e8q`.
- The array **alternates**: index 0 is the solver's move, index 1 the opponent's
  forced reply, index 2 the solver's next move, and so on.
- The puzzle is solved once the solver has played all of their moves.

### Validate your puzzles

Every puzzle is checked by `src/content/puzzles/puzzles.test.ts` — it replays
each solution through chess.js and fails on any illegal move (and requires mate
for `backRank` puzzles). Run it after adding puzzles:

```bash
npm test
```

### Where the bulk of the puzzles come from (Lichess database)

You rarely need to hand-write a puzzle. Every lesson already gets ~6 puzzles
imported from the **Lichess open puzzle database** (CC0, 6M puzzles tagged by
theme), written to `src/content/puzzles/generated.ts`. A lesson shows its
hand-picked `puzzleIds` first, then its imported ones.

`generated.ts` is committed, so a normal clone, build and deploy never touch the
network. You only re-run the import to change what a lesson gets:

1. **Edit the lesson's query** in `scripts/puzzle-queries.mjs`:

   ```js
   'tactics-knight-forks': { any: ['fork', 'smotheredMate'], rating: [800, 1800] },
   ```

   `any` = the puzzle must carry at least one of these themes; `all` = it must
   carry every one (usually a phase tag like `opening`); `rating` = the Glicko
   band, defaulting to the lesson's category. Theme names must be the exact
   Lichess ones — a typo silently matches nothing. The canonical list is at
   [puzzleTheme.xml](https://github.com/lichess-org/lila/blob/master/translation/source/puzzleTheme.xml).

2. **Run the import.** It downloads the database to `.cache/` (gitignored,
   ~300 MB) the first time, then streams it — nothing but the per-lesson pools
   is held in memory:

   ```bash
   npm run import-puzzles     # add --download to force-refresh the database
   ```

   It fails loudly if any lesson matched no puzzles, and warns about lessons
   that came up short — both mean the query is too narrow.

3. **Run the tests.** `npm test` replays every imported line for legality.

The importer writes the `idea` and the three `hints` itself, from the puzzle's
theme tags plus the piece that makes the first move ("The key move is a knight
move. It is a check."). The database has no prose of its own.

Two details worth knowing if you touch `scripts/import-puzzles.mjs`:

- A database row's FEN is the position **before** the opponent's blunder, and
  the first listed move **is** that blunder. Our `solution` starts with the
  solver, so the importer plays that move onto the FEN and stores the result.
  Get this wrong and every puzzle is off by one ply — still legal, still
  plausible, and completely wrong.
- Each puzzle is assigned to exactly **one** lesson, because progress is keyed
  on puzzle id. Lessons that want the same motif therefore compete, and the
  importer keeps a deep candidate pool per lesson so the last one resolved does
  not starve.

## 5. Narration (text-to-speech)

Every lesson page has a **Listen** button that reads the article aloud with the
browser's own speech synthesizer (`SpeechSynthesis`). There are no audio files
and no API keys: the narration is generated on the reader's device, offline, and
costs nothing to host.

The spoken text is read from the **rendered article**, not from the MDX source,
so it always matches what is on the page — including anything a React component
renders. You do not write a separate script. You write the article so that it
works read aloud, and you mark the places where eye and ear need different
things.

### Notation is spoken for you

`src/audio/notation.ts` rewrites chess notation into words before it reaches the
synthesizer, so write notation normally:

| Written  | Spoken                          |
| -------- | ------------------------------- |
| `Nf3`    | knight to F three               |
| `Bxh7+`  | bishop takes H seven, check     |
| `exd5`   | E pawn takes D five             |
| `e8=Q`   | pawn to E eight promoting to queen |
| `O-O-O`  | castles queenside               |
| the `d-file` | the D file                  |

A square named in prose ("control the e4 square") is read as a square, not as a
move. Never spell notation out phonetically yourself — you would end up with it
being expanded twice.

### `<Spoken>` and `<Silent>`

Two components are available in every lesson without importing them:

```mdx
<Silent>
| Condition        | Why it matters |
| ---------------- | -------------- |
| Bishop on d3     | Hits h7        |
| Knight ready for g5 | Follows the check |
</Silent>

<Spoken>The three conditions are a bishop bearing down on h7, a knight that can reach g5 in one move, and a queen with a clear path to the h-file.</Spoken>
```

- **`<Silent>`** is shown but never spoken. Wrap anything that only works
  visually — a table, an ASCII board, a long bare move list.
- **`<Spoken>`** is visually hidden but read aloud. Use it to hand the listener
  what the eye would otherwise supply.

The rule: **a listener who never looks at the screen must get the whole lesson.**
Anything visual gets a `<Spoken>` sentence that says the same thing in words, and
phrases like "as you can see below" don't belong in either version.

Most articles need neither component — flowing prose with inline notation already
reads aloud fine. Reach for them only when the page genuinely shows something the
narration can't say.

Any component you write can opt out of the audio the same way `<Silent>` does, by
rendering `data-tts="skip"` on its root element.

## 6. Adding a brand-new lesson

Either copy an existing `.mdx` file and edit its frontmatter, or add the topic to
the `CATEGORIES` table in `scripts/generate-lessons.mjs` (as a
`[title, summary]` pair) and run the generator:

```bash
npm run generate-lessons            # idempotent: never overwrites existing files
npm run generate-lessons -- --prune # also deletes lessons no longer in the topic list
```

New categories must be registered in `src/content/curriculum.ts`
(`CATEGORY_DEFINITIONS`) so the category heading and ordering appear on the home
page.
