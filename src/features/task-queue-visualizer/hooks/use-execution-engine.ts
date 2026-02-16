import { useState, useCallback, useRef, useEffect } from 'react'
import type { ExecutionStep, QueueState, QueueType } from '@shared/types/queue-types'
import { buildExecutionSteps } from '../helpers/build-execution-steps'

type PlaybackState = 'idle' | 'playing' | 'paused' | 'finished'

interface ExecutionEngine {
  queueState: QueueState
  steps: ExecutionStep[]
  playbackState: PlaybackState
  speed: number
  currentStepIndex: number
  totalSteps: number
  play: () => void
  pause: () => void
  step: () => void
  reset: () => void
  setSpeed: (speed: number) => void
  loadCode: (code: string) => void
}

function createEmptyQueueState(): QueueState {
  return {
    callStack: [],
    microtask: [],
    macrotask: [],
    animation: [],
    idle: [],
    output: [],
    currentStepIndex: -1,
    highlightedLine: null,
    currentAnnotation: null,
  }
}

export function useExecutionEngine(initialCode: string): ExecutionEngine {
  const [steps, setSteps] = useState<ExecutionStep[]>(() => buildExecutionSteps(initialCode))
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  const [queueState, setQueueState] = useState<QueueState>(createEmptyQueueState())
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle')
  const [speed, setSpeed] = useState(1)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stepsRef = useRef(steps)
  const currentIndexRef = useRef(currentStepIndex)

  stepsRef.current = steps
  currentIndexRef.current = currentStepIndex

  const applyStep = useCallback((stepIndex: number, allSteps: ExecutionStep[]) => {
    const step = allSteps[stepIndex]
    if (!step) return

    setQueueState((prev) => {
      const next = { ...prev }
      next.callStack = [...prev.callStack]
      next.microtask = [...prev.microtask]
      next.macrotask = [...prev.macrotask]
      next.animation = [...prev.animation]
      next.idle = [...prev.idle]
      next.output = [...prev.output]
      next.currentStepIndex = stepIndex
      next.highlightedLine = step.sourceLine
      next.currentAnnotation = step.annotation

      const queueKey = step.queueType as QueueType

      switch (step.phase) {
        case 'enqueue':
          next[queueKey] = [...next[queueKey], step]
          break

        case 'dequeue':
          next[queueKey] = next[queueKey].filter(
            (s) => !(s.label === step.label && s.queueType === step.queueType)
          )
          next.callStack = [...next.callStack, step]
          break

        case 'execute':
          // For sync tasks, briefly appear on call stack
          if (step.queueType === 'callStack') {
            next.callStack = [step]
          } else {
            // Remove from call stack after execution
            next.callStack = next.callStack.filter(
              (s) => !(s.label === step.label && s.queueType === step.queueType)
            )
          }
          if (step.output) {
            next.output = [...next.output, step.output]
          }
          break

        case 'output':
          if (step.output) {
            next.output = [...next.output, step.output]
          }
          break
      }

      return next
    })
  }, [])

  const advanceStep = useCallback(() => {
    const nextIndex = currentIndexRef.current + 1
    if (nextIndex >= stepsRef.current.length) {
      setPlaybackState('finished')
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    setCurrentStepIndex(nextIndex)
    applyStep(nextIndex, stepsRef.current)
  }, [applyStep])

  const play = useCallback(() => {
    if (currentIndexRef.current >= stepsRef.current.length - 1) {
      return
    }
    setPlaybackState('playing')
  }, [])

  const pause = useCallback(() => {
    setPlaybackState('paused')
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const stepOnce = useCallback(() => {
    if (playbackState === 'playing') {
      pause()
    }
    advanceStep()
  }, [advanceStep, pause, playbackState])

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setCurrentStepIndex(-1)
    setQueueState(createEmptyQueueState())
    setPlaybackState('idle')
  }, [])

  const loadCode = useCallback((code: string) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    const newSteps = buildExecutionSteps(code)
    setSteps(newSteps)
    setCurrentStepIndex(-1)
    setQueueState(createEmptyQueueState())
    setPlaybackState('idle')
  }, [])

  // Auto-play interval
  useEffect(() => {
    if (playbackState === 'playing') {
      if (intervalRef.current) clearInterval(intervalRef.current)
      const ms = Math.max(200, 1200 - speed * 200)
      intervalRef.current = setInterval(() => {
        advanceStep()
      }, ms)
    }

    return () => {
      if (intervalRef.current && playbackState !== 'playing') {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [playbackState, speed, advanceStep])

  return {
    queueState,
    steps,
    playbackState,
    speed,
    currentStepIndex,
    totalSteps: steps.length,
    play,
    pause,
    step: stepOnce,
    reset,
    setSpeed,
    loadCode,
  }
}
