import { Show } from 'meemaw'
import { QUEUE_COLORS } from '@shared/constants/queue-colors'
import type { QueueState, QueueType, ExecutionStep } from '@shared/types/queue-types'

interface QueueVisualizationProps {
  queueState: QueueState
}

const QUEUE_ORDER: QueueType[] = ['callStack', 'microtask', 'macrotask', 'animation', 'idle']

export function QueueVisualization({ queueState }: QueueVisualizationProps) {
  return (
    <div className="flex flex-col h-full bg-surface-raised rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-semibold text-text-muted">
          Queues & Event Loop
        </span>
        <span className="text-[10px] text-text-dim font-mono">
          Priority: microtask → macrotask → rAF → idle
        </span>
      </div>

      <div className="flex-1 overflow-auto p-2 space-y-1.5">
        {QUEUE_ORDER.map((queueType) => (
          <QueueLane
            key={queueType}
            queueType={queueType}
            items={queueState[queueType]}
          />
        ))}

        <Show when={!!queueState.currentAnnotation}>
          <div className="mt-2 px-3 py-2 bg-surface-overlay rounded-md border border-border-light">
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-0.5">
              Current Step
            </p>
            <p className="text-xs text-text leading-relaxed">
              {queueState.currentAnnotation}
            </p>
          </div>
        </Show>
      </div>
    </div>
  )
}

function QueueLane({ queueType, items }: { queueType: QueueType; items: ExecutionStep[] }) {
  const colors = QUEUE_COLORS[queueType]

  return (
    <div className={`rounded-md border ${colors.border} ${colors.bg} p-2`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${colors.text}`}>
          {colors.label}
        </span>
        <span className={`text-[10px] font-mono ${colors.text} opacity-60`}>
          {items.length}
        </span>
      </div>

      <div className="min-h-[28px] flex flex-wrap gap-1">
        <Show when={items.length === 0}>
          <span className="text-[10px] text-text-dim italic">empty</span>
        </Show>
        {items.map((item) => (
          <QueueItem key={item.id} item={item} queueType={queueType} />
        ))}
      </div>
    </div>
  )
}

function QueueItem({ item, queueType }: { item: ExecutionStep; queueType: QueueType }) {
  const colors = QUEUE_COLORS[queueType]

  return (
    <div
      className={`group relative px-2 py-1 rounded border ${colors.border} bg-surface/60 cursor-default
        animate-[fadeIn_0.3s_ease-out] transition-all`}
      title={`${item.code}\nType: ${colors.label}`}
    >
      <span className={`text-[10px] font-mono font-medium ${colors.text}`}>
        {item.label}
      </span>

      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-20 min-w-[200px]">
        <div className="bg-surface-overlay border border-border-light rounded-md p-2 shadow-lg">
          <p className={`text-[10px] font-bold ${colors.text} mb-0.5`}>{colors.label}</p>
          <pre className="text-[10px] font-mono text-text/80 whitespace-pre-wrap">{item.code}</pre>
        </div>
      </div>
    </div>
  )
}
