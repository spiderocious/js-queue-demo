import type { QueueType } from '@shared/types/queue-types'

export const QUEUE_COLORS: Record<QueueType, { bg: string; text: string; border: string; label: string }> = {
  callStack: {
    bg: 'bg-callstack/15',
    text: 'text-callstack',
    border: 'border-callstack/40',
    label: 'Call Stack',
  },
  microtask: {
    bg: 'bg-microtask/15',
    text: 'text-microtask',
    border: 'border-microtask/40',
    label: 'Microtask Queue',
  },
  macrotask: {
    bg: 'bg-macrotask/15',
    text: 'text-macrotask',
    border: 'border-macrotask/40',
    label: 'Macrotask Queue',
  },
  animation: {
    bg: 'bg-animation/15',
    text: 'text-animation',
    border: 'border-animation/40',
    label: 'Animation Frame',
  },
  idle: {
    bg: 'bg-idle/15',
    text: 'text-idle',
    border: 'border-idle/40',
    label: 'Idle Callback',
  },
}
