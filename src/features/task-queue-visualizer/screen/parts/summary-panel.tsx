import { useState } from 'react'
import { ChevronDown, ChevronUp, Info } from '@icons'
import { QUEUE_COLORS } from '@shared/constants/queue-colors'
import type { QueueType } from '@shared/types/queue-types'

const PRIORITY_ORDER: { type: QueueType; description: string }[] = [
  {
    type: 'callStack',
    description: 'Synchronous code executes immediately. Functions push/pop frames onto the stack.',
  },
  {
    type: 'microtask',
    description:
      'Promise.then, queueMicrotask, MutationObserver. Drains completely after each task before the next macrotask.',
  },
  {
    type: 'macrotask',
    description:
      'setTimeout, setInterval, I/O callbacks. One macrotask executes per event loop iteration, then microtasks drain.',
  },
  {
    type: 'animation',
    description:
      'requestAnimationFrame. Runs before the browser paints, typically at 60fps. Used for visual updates.',
  },
  {
    type: 'idle',
    description:
      'requestIdleCallback. Runs when the browser is idle with no pending work. Lowest priority.',
  },
]

export function SummaryPanel() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="bg-surface-raised rounded-lg border border-border overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-surface-overlay transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <Info size={13} className="text-primary" />
          <span className="text-xs font-semibold text-text-muted">
            Event Loop — How It Works
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp size={14} className="text-text-dim" />
        ) : (
          <ChevronDown size={14} className="text-text-dim" />
        )}
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 space-y-2 animate-[fadeIn_0.2s_ease-out]">
          <p className="text-xs text-text-muted leading-relaxed">
            The JavaScript event loop continuously checks queues in priority order.
            After each macrotask, the entire microtask queue drains before moving on.
          </p>

          <div className="space-y-1.5">
            {PRIORITY_ORDER.map(({ type, description }, i) => {
              const colors = QUEUE_COLORS[type]
              return (
                <div key={type} className="flex items-start gap-2">
                  <div className="flex items-center gap-1 shrink-0 mt-0.5">
                    <span className={`text-[10px] font-bold ${colors.text}`}>{i + 1}.</span>
                    <span
                      className={`inline-block w-2 h-2 rounded-sm ${colors.bg} border ${colors.border}`}
                    />
                  </div>
                  <div>
                    <span className={`text-[10px] font-bold ${colors.text}`}>
                      {colors.label}
                    </span>
                    <p className="text-[10px] text-text-dim leading-relaxed">{description}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="pt-1 border-t border-border">
            <p className="text-[10px] text-text-dim leading-relaxed">
              <span className="font-semibold text-text-muted">Loop cycle:</span>{' '}
              Pick one macrotask → Execute it → Drain all microtasks → Render (rAF) → Idle callbacks → Repeat
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
