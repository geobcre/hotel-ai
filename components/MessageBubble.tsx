import type { MessageBubbleProps } from '@/types'

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`
          w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-medium
          ${isUser
            ? 'bg-[var(--user-bubble)] text-[var(--user-bubble-text)]'
            : 'bg-[var(--surface-alt)] text-[var(--text-muted)] border border-[var(--border)]'
          }
        `}
      >
        {isUser ? 'tú' : 'AI'}
      </div>

      {/* Burbuja */}
      <div
        className={`
          max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
          ${isUser
            ? 'bg-[var(--user-bubble)] text-[var(--user-bubble-text)] rounded-tr-sm'
            : 'bg-[var(--assistant-bubble)] text-[var(--assistant-bubble-text)] border border-[var(--border)] rounded-tl-sm'
          }
        `}
      >
        {message.content.split('\n').map((line, i) => (
          <span key={i}>
            {line}
            {i < message.content.split('\n').length - 1 && <br />}
          </span>
        ))}
      </div>
    </div>
  )
}
