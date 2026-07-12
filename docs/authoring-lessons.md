# Authoring lessons

A lesson is a single MDX file in `src/content/lessons/`. It has **frontmatter**
(structured fields at the top) and an **article body** (Markdown/MDX below the
frontmatter). This guide covers how to write one, attach media and puzzles, and
add more puzzles.

## 1. Anatomy of a lesson file

```mdx
---
slug: b12-forks-pins-skewers-double     # unique; matches the file name
title: "Forks, pins, skewers, and double attacks"
module: "Beginner pathway"               # must match a module in curriculum.ts
stage: "Stage A–C"                        # rating band label (display only)
order: 12                                 # global ordering across all lessons
summary: "Forks, pins, skewers, and double attacks."
youtubeId: "dQw4w9WgXcQ"                 # YouTube video id (after ?v=)
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
| `title`     | yes      | Shown as the page heading and in nav.                        |
| `module`    | yes      | Must exactly match a `name` in `src/content/curriculum.ts`.  |
| `stage`     | yes      | Free-text band label, e.g. `"Stage A–C"`, `"Modules 11–20"`. |
| `order`     | yes      | Integer; lessons are sorted globally by this.                |
| `summary`   | yes      | One sentence; shown on cards and at the top of the lesson.   |
| `youtubeId` | no       | The id after `v=` in a YouTube URL. Empty shows a placeholder. |
| `puzzleIds` | no       | Array of puzzle ids (see below). Empty shows a note.         |
| `games`     | no       | List of `{ label, url, note? }`. Empty shows a note.         |

## 2. Adding the video

Find the video's id — in `https://www.youtube.com/watch?v=ABC123`, the id is
`ABC123` — and set `youtubeId: "ABC123"`. The embed is lazy (it loads only when
the user clicks play) and uses the privacy-enhanced `youtube-nocookie` domain.

## 3. Adding grandmaster games

Add entries under `games`. Any URL works (Lichess study, chessgames.com,
Wikipedia, a YouTube analysis, etc.):

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

### Importing many puzzles (Lichess database)

For volume, seed from the **Lichess open puzzle database** (CC0, ~4M puzzles
tagged by theme such as `fork`, `pin`, `backRank`, `mateIn2`):
<https://database.lichess.org/#puzzles>. Filter the CSV by the `Themes` column
to match a lesson, then map each row to the `Puzzle` shape above (the CSV gives
FEN and the solution moves in UCI). Keep the CC0 attribution in `source`.

## 5. Adding a brand-new lesson

Either copy an existing `.mdx` file and edit its frontmatter, or run the
generator to create any missing stubs from the curriculum:

```bash
npm run generate-lessons   # idempotent: never overwrites existing lesson files
```

New modules must be registered in `src/content/curriculum.ts`
(`MODULE_DEFINITIONS`) so the module heading and ordering appear on the home
page.
