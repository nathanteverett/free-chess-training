import type { CreateGameRequest, CreateGameResponse } from '../../shared/protocol'

/**
 * The game server lives on its own origin (the static site ships a 38 MB
 * Stockfish network, which is over Cloudflare's asset size limit, so the two
 * cannot share a deploy). Empty means same-origin, which is what `vite dev`
 * uses — it proxies /api to the local Worker.
 */
const SERVER = (import.meta.env.VITE_LIVE_SERVER_URL ?? '').replace(/\/$/, '')

/**
 * The seat token proves "I am the player on this side of this game" without an
 * account. It is scoped to one game code, meaningless anywhere else, and dies
 * with the game — so localStorage is exactly the right place for it.
 */
const tokenKey = (code: string) => `live-game-token:${code}`

export function readToken(code: string): string | undefined {
  return localStorage.getItem(tokenKey(code)) ?? undefined
}

export function writeToken(code: string, token: string): void {
  if (token) localStorage.setItem(tokenKey(code), token)
}

export async function createGame(
  request: CreateGameRequest,
): Promise<CreateGameResponse> {
  const response = await fetch(`${SERVER}/api/game`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? 'Could not create the game.')
  }
  const created = (await response.json()) as CreateGameResponse
  writeToken(created.code, created.token)
  return created
}

export function gameSocketUrl(code: string): string {
  const base = SERVER || location.origin
  return `${base.replace(/^http/, 'ws')}/api/game/${code}/ws`
}

/** The link a host shares — always the site, never the game server. */
export function inviteUrl(code: string): string {
  // BASE_URL carries the subpath the site is served from (and its trailing
  // slash), so the invite still resolves when that is not the domain root.
  return `${location.origin}${import.meta.env.BASE_URL}play/${code}`
}
