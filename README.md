# Free Chess Training

An open-source chess curriculum that takes players from complete beginner to
master preparation. Every lesson pairs a written **article** and an embedded
**video** with interactive **puzzles** (progressive hints + explained ideas),
links to **grandmaster games**, and a built-in **Stockfish engine** for checking
any position — all running in the browser, no account required.

The curriculum (`comprehensive_chess_curriculum.md`) is broken into **181
one-topic lessons** filed under seven **skill categories**, from board basics to
competitive mastery. Categories group lessons by the skill they build — they are
not a rating ladder and carry no stage band.

## Features

- **Curriculum browser** — 181 lessons across 7 skill categories, as a
  collapsible list, with per-lesson and overall progress tracking.
- **Lessons** — one topic each: Markdown/MDX article, lazy YouTube Short focused
  on that concept, practice puzzles, grandmaster game links,
  and mark-complete tracking.
- **Puzzle trainer** — play the solution line against auto-replied opponent
  moves, with **progressive hints** (revealed one at a time) and an **explained
  idea** on solve.
- **Analysis board** — play both sides, load any FEN, and get a live Stockfish
  evaluation (eval bar + best line), plus an "Open in Lichess" link.
- **Live play** — create a game, share the six-character **access code**, and
  play someone in real time: server-enforced rules, chess clocks, draw offers,
  takebacks, resignation, chat, and reconnect after a dropped connection. Also
  available as a **shared analysis board**, where either player can move either
  side and take moves back freely, and checkmate is the only thing called.
  Still **no account** — see [Live play](#live-play).
- **Local-first progress** — saved to `localStorage` today, behind a storage
  interface so a backend can be added later without touching the UI.

## Tech stack

React + TypeScript + Vite · Tailwind CSS · [chess.js] (rules) ·
[react-chessboard] (board) · [Stockfish 16] WASM (engine) · MDX (lessons) ·
[Cloudflare Durable Objects] (live play only).

[chess.js]: https://github.com/jhlywa/chess.js
[react-chessboard]: https://github.com/Clariity/react-chessboard
[Stockfish 16]: https://github.com/nmrugg/stockfish.js
[Cloudflare Durable Objects]: https://developers.cloudflare.com/durable-objects/

## Quick start

```bash
npm install        # also copies the Stockfish engine into public/ (postinstall)
npm run dev        # start the dev server at http://localhost:5173
npm run dev:worker # (optional) the live-game server, needed only for /play
```

Everything except live play works with the Worker stopped.

Other scripts:

```bash
npm run build             # type-check + production build to dist/
npm run preview           # preview the production build
npm test                  # run unit tests (puzzle validation, etc.)
npm run generate-lessons  # (re)generate lesson stubs from the curriculum
npm run deploy:worker     # deploy the live-game server to Cloudflare
```

> **Engine note:** we ship the **single-threaded** Stockfish build on purpose —
> it needs no special COOP/COEP headers, so it runs in `vite dev` and on any
> static host with zero config. The engine files (including a ~39 MB neural net)
> are copied from `node_modules` into `public/stockfish/` by
> `scripts/copy-engine.mjs` and are gitignored rather than committed.

## Live play

Two people in different places cannot share a board without something in the
middle, so live play — and **only** live play — has a server. It is a small
Cloudflare Worker in [`worker/`](worker/): one
[Durable Object](https://developers.cloudflare.com/durable-objects/) per game,
named by its access code, holding the position, the clocks, and the chat.

**How a game starts.** The host picks the rules and a time control, and gets a
six-character code (`K4P2QX`) plus a shareable link. The first two people to
open it are the players; anyone else who has the code watches. The code is the
room's address and the invitation — it is deliberately *not* a credential.

**No accounts, and none needed.** On first join the room mints an opaque **seat
token** and the browser keeps it in `localStorage` under that game's code. It is
not a login: no email, no password, no profile, and it is meaningless outside the
one game. It exists so that a refresh or a dropped connection can prove "I am the
one playing Black here" and get the position, the clock, and the chat back. It
also stops a third person with the link from sitting down in your seat. When the
game ends, it is inert.

**Who decides what.** The server is the referee: it runs `chess.js` itself,
rejects illegal and out-of-turn moves, owns the clock, and calls checkmate,
stalemate, repetition, the fifty-move rule, and flag-fall. Clocks are charged on
each move and a Durable Object *alarm* fires exactly when the side to move would
run out of time, so a flag is authoritative without a server ticking every
second. Clients only ever render what the server last sent.

**Shared analysis board.** The other mode drops the referee: either player may
move either side, moves must still be legal but turn order is not enforced,
takebacks need nobody's permission, and there is no clock. Checkmate is the one
thing the server still declares.

### Holding up in public

A public link means strangers, so the room defends itself:

- **Games expire.** A Durable Object left alone would sit in storage forever,
  invisible and billable. Every room carries a deadline that each action pushes
  out — one hour for an invitation nobody accepts, a day for a live game, half an
  hour after it ends — and then it deletes itself and frees the code.
- **Creating a game is rate-limited** (10/min per IP): it is the verb that costs
  a Durable Object. Joining is capped far more loosely (60/min), which is enough
  to make guessing codes pointless.
- **Each connection has a flood budget** — about 25 messages, refilling at 2/s,
  with chat costing more than a move. Normal play never notices; a script hits it
  immediately.
- **Rooms cap at 30 connections**, messages at 4 KB, and chat lines at 300
  characters, so a code cannot be turned into a broadcast relay or a message
  store.

There is **no moderation and no profanity filter** on chat. It is two people who
exchanged a code, and that is the threat model — do not link a game publicly and
expect a moderated room.

### Deploying it

The site is static and the game server is a Worker, and the two deploy
**separately** — the site ships Stockfish's ~39 MB neural network, which is over
Cloudflare's 25 MiB limit for a static asset, so it cannot ride along in the
Worker's asset bundle.

First tell the Worker which site may call it, by setting `ALLOWED_ORIGINS` in
[`wrangler.jsonc`](wrangler.jsonc) — without it, any page on the web can drive
your game server from a browser:

```jsonc
"vars": { "ALLOWED_ORIGINS": "https://YOU.github.io" }
```

```bash
npm run deploy:worker      # → https://free-chess-training-live.<you>.workers.dev
```

Then build the site pointing at it. This is a **build-time** value — it is baked
into the bundle, so it has to be set wherever the site is built:

```bash
VITE_LIVE_SERVER_URL=https://free-chess-training-live.<you>.workers.dev npm run build
```

Deploy `dist/` to any static host. With `VITE_LIVE_SERVER_URL` unset, the client
talks to the same origin, which is what `npm run dev` does — it proxies `/api` to
the Worker on port 8787.

> Rate limits are enforced on Cloudflare's network, **not** in `wrangler dev`, so
> a local Worker will happily let you flood it.

## Project structure

```
comprehensive_chess_curriculum.md   # master syllabus (source for lessons)
scripts/
  copy-engine.mjs        # copies Stockfish into public/ (install/dev/build)
  generate-lessons.mjs   # generates one MDX lesson stub per topic
  smoke.mjs              # headless end-to-end check of a running dev server
icons/pixel-art-fct/     # source piece art (the app's palette is sampled from it)
public/pieces/           # downscaled board sprites served to the browser
src/
  content/
    lessons/*.mdx        # one file per lesson (frontmatter + article)
    puzzles/index.ts     # puzzle bank (FEN + solution + hints + idea)
    curriculum.ts        # skill categories + grouping logic
    videos.ts            # curated lesson Shorts + Shorts search fallback
    lessons.ts           # loads lessons via import.meta.glob
  components/
    chess/               # BoardView, PuzzleTrainer, EnginePanel, EvalBar
    media/               # YouTubeEmbed, GameLinks
    layout/              # app shell
    live/                # Clock, MoveList, Chat
  engine/                # EngineService (Stockfish worker) + useEngine hook
  progress/              # ProgressStore interface + localStorage impl + context
  routes/                # Home, Lesson, Analysis, Play, LiveGame
  live/                  # game socket hook + seat-token storage
  lib/                   # chess helpers, Lichess link builder
shared/protocol.ts       # wire protocol shared by the browser and the Worker
worker/                  # live-game server (Worker entry + GameRoom Durable Object)
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
