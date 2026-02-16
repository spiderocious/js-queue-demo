export type QueueType = 'callStack' | 'microtask' | 'macrotask' | 'animation' | 'idle'

export interface ExecutionStep {
  id: string
  code: string
  label: string
  annotation: string
  queueType: QueueType
  sourceLine: number
  phase: 'enqueue' | 'dequeue' | 'execute' | 'output'
  output?: string
}

export interface QueueState {
  callStack: ExecutionStep[]
  microtask: ExecutionStep[]
  macrotask: ExecutionStep[]
  animation: ExecutionStep[]
  idle: ExecutionStep[]
  output: string[]
  currentStepIndex: number
  highlightedLine: number | null
  currentAnnotation: string | null
}
