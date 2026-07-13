import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  ClientMessage,
  GameState,
  Seat,
  ServerMessage,
} from '../../shared/protocol'
import { gameSocketUrl, readToken, writeToken } from './api'

export type Connection = 'connecting' | 'open' | 'closed' | 'gone'

export interface LiveGame {
  state: GameState | null
  you: Seat | null
  connection: Connection
  error: string | null
  /** Add to `Date.now()` to get server time — the clock is authoritative there. */
  serverOffset: number
  send: (message: ClientMessage) => void
  dismissError: () => void
}

const MAX_BACKOFF_MS = 10_000

/**
 * Owns the WebSocket for one game: joins with the stored seat token, keeps the
 * latest server snapshot, and reconnects with backoff when the network drops.
 * The server sends whole states, so there is nothing to merge — the last
 * message always wins, and a reconnect self-heals.
 */
export function useLiveGame(code: string): LiveGame {
  const [state, setState] = useState<GameState | null>(null)
  const [you, setYou] = useState<Seat | null>(null)
  const [connection, setConnection] = useState<Connection>('connecting')
  const [error, setError] = useState<string | null>(null)
  const [serverOffset, setServerOffset] = useState(0)

  const socketRef = useRef<WebSocket | null>(null)
  const attemptRef = useRef(0)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closedRef = useRef(false)

  useEffect(() => {
    closedRef.current = false

    const connect = () => {
      if (closedRef.current) return
      setConnection('connecting')

      const socket = new WebSocket(gameSocketUrl(code))
      socketRef.current = socket

      socket.onopen = () => {
        attemptRef.current = 0
        setConnection('open')
        socket.send(
          JSON.stringify({ t: 'join', token: readToken(code) } satisfies ClientMessage),
        )
      }

      socket.onmessage = (event) => {
        let message: ServerMessage
        try {
          message = JSON.parse(event.data as string)
        } catch {
          return
        }

        if (message.t === 'error') return setError(message.message)

        setServerOffset(message.now - Date.now())
        setState(message.state)
        if (message.t === 'welcome') {
          setYou(message.you)
          writeToken(code, message.token)
        }
      }

      socket.onclose = () => {
        if (closedRef.current) return
        setConnection('closed')
        const delay = Math.min(MAX_BACKOFF_MS, 500 * 2 ** attemptRef.current++)
        retryRef.current = setTimeout(connect, delay)
      }
    }

    connect()

    return () => {
      closedRef.current = true
      if (retryRef.current) clearTimeout(retryRef.current)
      socketRef.current?.close()
    }
  }, [code])

  const send = useCallback((message: ClientMessage) => {
    const socket = socketRef.current
    if (socket?.readyState !== WebSocket.OPEN) {
      return setError('Not connected — reconnecting…')
    }
    socket.send(JSON.stringify(message))
  }, [])

  const dismissError = useCallback(() => setError(null), [])

  return { state, you, connection, error, serverOffset, send, dismissError }
}

/** Live remaining time for one side, ticking locally against the server clock. */
export function useRemainingMs(
  state: GameState | null,
  color: 'white' | 'black',
  serverOffset: number,
): number {
  const [, tick] = useState(0)
  const clock = state?.clock
  const running = clock?.running === color

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => tick((n) => n + 1), 200)
    return () => clearInterval(id)
  }, [running])

  if (!clock) return 0
  const base = color === 'white' ? clock.whiteMs : clock.blackMs
  if (!running) return base
  const elapsed = Date.now() + serverOffset - clock.since
  return Math.max(0, base - elapsed)
}
