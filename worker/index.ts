import {
  CODE_ALPHABET,
  CODE_LENGTH,
  isValidCode,
  TIME_CONTROLS,
  type Color,
  type CreateGameRequest,
  type CreateGameResponse,
} from '../shared/protocol'
import { GameRoom } from './room'

export { GameRoom }

export interface Env {
  GAME_ROOM: DurableObjectNamespace<GameRoom>
  /** Per-IP caps. See wrangler.jsonc. Not enforced in local development. */
  CREATE_LIMIT: RateLimit
  JOIN_LIMIT: RateLimit
  /** Comma-separated origins allowed to use the API; empty means any. */
  ALLOWED_ORIGINS: string
}

/**
 * The live-game server, and the only server this project has: everything else
 * — lessons, puzzles, the engine — is static and runs in the browser. This
 * exists because two people in different places cannot share a board without
 * something in the middle.
 *
 * It is deployed on its own origin, separate from the static site, and holds
 * one Durable Object per game, named by its access code. The code is the room
 * address and the invitation; it is not a credential. What proves you are a
 * given player is the seat token the room mints on first join.
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const origin = request.headers.get('Origin')

    if (!originAllowed(env, origin)) {
      return new Response('Origin not allowed.', { status: 403 })
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors(env, origin) })
    }

    if (url.pathname === '/api/game' && request.method === 'POST') {
      return createGame(request, env, origin)
    }

    const match = url.pathname.match(/^\/api\/game\/([A-Z0-9]+)\/ws$/)
    if (match) return openSocket(request, env, origin, match[1])

    return new Response('Not found', { status: 404, headers: cors(env, origin) })
  },
} satisfies ExportedHandler<Env>

async function createGame(
  request: Request,
  env: Env,
  origin: string | null,
): Promise<Response> {
  // A game is a Durable Object that outlives the request, so this is the verb
  // that costs something. Cap it before doing any work.
  const { success } = await env.CREATE_LIMIT.limit({ key: clientKey(request) })
  if (!success) {
    return json(env, origin, { error: 'Too many new games. Wait a minute.' }, 429)
  }

  let body: CreateGameRequest
  try {
    body = (await request.json()) as CreateGameRequest
  } catch {
    return json(env, origin, { error: 'Expected a JSON body.' }, 400)
  }

  const mode = body.mode === 'freeplay' ? 'freeplay' : 'referee'

  // Only accept the time controls the UI offers, so a hand-rolled request can't
  // create a game with a thousand-hour clock and pin an alarm forever.
  const time = TIME_CONTROLS.find(
    (option) =>
      option.time.initialMs === body.time?.initialMs &&
      option.time.incrementMs === body.time?.incrementMs,
  )?.time
  if (!time) return json(env, origin, { error: 'Unknown time control.' }, 400)

  const hostColor: Color =
    body.hostColor === 'white' || body.hostColor === 'black'
      ? body.hostColor
      : randomColor()

  // Codes are short enough to read over a phone, so collisions are possible.
  // `create` refuses to overwrite a live game, which lets us simply try again.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newCode()
    const room = env.GAME_ROOM.getByName(code)
    const token = await room.create(code, { mode, time, hostColor }, hostColor)
    if (token) {
      return json(env, origin, { code, token, color: hostColor } satisfies CreateGameResponse)
    }
  }

  return json(env, origin, { error: 'Could not allocate a game code. Try again.' }, 503)
}

async function openSocket(
  request: Request,
  env: Env,
  origin: string | null,
  code: string,
): Promise<Response> {
  if (request.headers.get('Upgrade') !== 'websocket') {
    return new Response('Expected a WebSocket upgrade.', {
      status: 426,
      headers: cors(env, origin),
    })
  }

  // Joining is cheap, but it is also how you would guess your way through the
  // code space, so it is capped too — just far more loosely than creating.
  const { success } = await env.JOIN_LIMIT.limit({ key: clientKey(request) })
  if (!success) {
    return new Response('Too many attempts. Wait a minute.', {
      status: 429,
      headers: cors(env, origin),
    })
  }

  if (!isValidCode(code)) {
    return new Response('No such game.', { status: 404, headers: cors(env, origin) })
  }

  const room = env.GAME_ROOM.getByName(code)
  // Don't let a typo'd code conjure an empty room into existence.
  if (!(await room.exists())) {
    return new Response('No such game.', { status: 404, headers: cors(env, origin) })
  }

  return room.fetch(request)
}

function newCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH))
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('')
}

function randomColor(): Color {
  return crypto.getRandomValues(new Uint8Array(1))[0] % 2 === 0 ? 'white' : 'black'
}

/** What we rate-limit on. Behind Cloudflare this header is set by the edge. */
function clientKey(request: Request): string {
  return request.headers.get('CF-Connecting-IP') ?? 'unknown'
}

function allowList(env: Env): string[] {
  return (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

/**
 * With ALLOWED_ORIGINS set, only the real site can drive this API — from a
 * browser, at least; nothing stops a script, and nothing needs to, since the
 * API carries no cookies and no ambient authority. An empty list allows any
 * origin, which is what local development needs.
 */
function originAllowed(env: Env, origin: string | null): boolean {
  const allowed = allowList(env)
  if (allowed.length === 0) return true
  // Non-browser callers send no Origin; there is nothing to protect them from.
  if (!origin) return true
  return allowed.includes(origin)
}

function cors(env: Env, origin: string | null): HeadersInit {
  const allowed = allowList(env)
  const value = allowed.length === 0 ? '*' : origin && allowed.includes(origin) ? origin : allowed[0]
  return {
    'access-control-allow-origin': value,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
    ...(allowed.length > 0 ? { vary: 'Origin' } : {}),
  }
}

function json(env: Env, origin: string | null, data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', ...cors(env, origin) },
  })
}
