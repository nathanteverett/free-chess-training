import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  isValidCode,
  TIME_CONTROLS,
  type Color,
  type Mode,
} from '../../shared/protocol'
import { createGame } from '../live/api'

const btn =
  'rounded bg-neutral-200 px-3 py-1.5 text-sm font-medium hover:bg-neutral-300 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-700 dark:hover:bg-neutral-600'
const primary =
  'rounded bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50'
const card =
  'rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900'

export function Play() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('referee')
  const [timeIndex, setTimeIndex] = useState(3)
  const [hostColor, setHostColor] = useState<Color | 'random'>('random')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [joinCode, setJoinCode] = useState('')

  const create = async () => {
    setCreating(true)
    setError('')
    try {
      const game = await createGame({
        mode,
        time: TIME_CONTROLS[timeIndex].time,
        hostColor,
      })
      navigate(`/play/${game.code}`)
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Could not create the game.')
      setCreating(false)
    }
  }

  const join = (event: FormEvent) => {
    event.preventDefault()
    const code = joinCode.trim().toUpperCase()
    if (!isValidCode(code)) return setError('That is not a valid access code.')
    navigate(`/play/${code}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Play a live game</h1>
        <p className="text-sm text-neutral-500">
          Create a game, share the access code, and play someone in real time. No
          account, no sign-up — the code is the invitation.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <section className={card} aria-label="Create a game">
          <h2 className="font-semibold">Create a game</h2>

          <fieldset className="mt-4">
            <legend className="text-sm font-medium">Rules</legend>
            <div className="mt-2 space-y-2">
              <label className="flex gap-2 text-sm">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === 'referee'}
                  onChange={() => setMode('referee')}
                  className="mt-1"
                />
                <span>
                  <span className="font-medium">Refereed game</span>
                  <span className="block text-neutral-500">
                    Turns, legal moves, clocks and the result are all enforced by the
                    server.
                  </span>
                </span>
              </label>
              <label className="flex gap-2 text-sm">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === 'freeplay'}
                  onChange={() => setMode('freeplay')}
                  className="mt-1"
                />
                <span>
                  <span className="font-medium">Shared analysis board</span>
                  <span className="block text-neutral-500">
                    Either player can move either side and take moves back freely.
                    Untimed, and checkmate is the only thing called.
                  </span>
                </span>
              </label>
            </div>
          </fieldset>

          <label className="mt-4 block text-sm font-medium">
            Time control
            <select
              value={timeIndex}
              onChange={(e) => setTimeIndex(Number(e.target.value))}
              disabled={mode === 'freeplay'}
              className="mt-1 w-full rounded border border-neutral-300 px-2 py-1.5 text-sm disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800"
            >
              {TIME_CONTROLS.map((option, index) => (
                <option key={option.label} value={index}>
                  {option.label}
                </option>
              ))}
            </select>
            {mode === 'freeplay' && (
              <span className="mt-1 block text-xs font-normal text-neutral-500">
                An analysis board has no turn order, so it has no clock.
              </span>
            )}
          </label>

          <div className="mt-4">
            <span className="text-sm font-medium">You play</span>
            <div className="mt-1 flex gap-2">
              {(['white', 'black', 'random'] as const).map((choice) => (
                <button
                  key={choice}
                  onClick={() => setHostColor(choice)}
                  className={`${btn} ${hostColor === choice ? '!bg-brand !text-white' : ''}`}
                >
                  {choice[0].toUpperCase() + choice.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <button onClick={create} disabled={creating} className={`${primary} mt-5 w-full`}>
            {creating ? 'Creating…' : 'Create game'}
          </button>
        </section>

        <section className={card} aria-label="Join a game">
          <h2 className="font-semibold">Join with a code</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Someone sent you a six-character code? Enter it here.
          </p>
          <form onSubmit={join} className="mt-4 flex gap-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="K4P2QX"
              maxLength={6}
              className="min-w-0 flex-1 rounded border border-neutral-300 px-3 py-2 text-lg font-semibold tracking-widest uppercase dark:border-neutral-700 dark:bg-neutral-800"
            />
            <button type="submit" className={primary}>
              Join
            </button>
          </form>
        </section>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
