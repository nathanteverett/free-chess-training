import { useEffect, useRef, useState } from 'react'
import { MAX_CHAT_LENGTH, type ChatMessage } from '../../../shared/protocol'

export function Chat({
  messages,
  onSend,
  disabled,
}: {
  messages: ChatMessage[]
  onSend: (text: string) => void
  disabled: boolean
}) {
  const [draft, setDraft] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' })
  }, [messages.length])

  const submit = () => {
    const text = draft.trim()
    if (!text) return
    onSend(text)
    setDraft('')
  }

  return (
    <div className="flex h-64 flex-col rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex-1 space-y-1 overflow-y-auto p-3 text-sm">
        {messages.length === 0 && (
          <p className="text-neutral-500">Say hello to your opponent.</p>
        )}
        {messages.map((message) => (
          <p key={message.id}>
            {message.from === 'system' ? (
              <span className="italic text-neutral-500">{message.text}</span>
            ) : (
              <>
                <span className="font-semibold">
                  {message.from === 'spectator'
                    ? 'Spectator'
                    : message.from === 'white'
                      ? 'White'
                      : 'Black'}
                  :{' '}
                </span>
                {message.text}
              </>
            )}
          </p>
        ))}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2 border-t border-neutral-200 p-2 dark:border-neutral-800">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          maxLength={MAX_CHAT_LENGTH}
          disabled={disabled}
          placeholder={disabled ? 'Connecting…' : 'Message'}
          className="min-w-0 flex-1 rounded border border-neutral-300 px-2 py-1 text-sm disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800"
        />
        <button
          onClick={submit}
          disabled={disabled}
          className="rounded bg-neutral-200 px-3 py-1 text-sm font-medium hover:bg-neutral-300 disabled:opacity-40 dark:bg-neutral-700 dark:hover:bg-neutral-600"
        >
          Send
        </button>
      </div>
    </div>
  )
}
