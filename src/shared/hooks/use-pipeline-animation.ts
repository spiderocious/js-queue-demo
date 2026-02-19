import { useState, useCallback, useRef, useEffect } from 'react'
import type { PipelineAnimState } from '@shared/types/pipeline'

interface PipelineAnimation {
  activeIndex: number
  animState: PipelineAnimState
  run: () => void
  reset: () => void
}

export function usePipelineAnimation(stageCount: number, intervalMs = 750): PipelineAnimation {
  const [activeIndex, setActiveIndex] = useState(-1)
  const [animState, setAnimState] = useState<PipelineAnimState>('idle')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stageCountRef = useRef(stageCount)
  stageCountRef.current = stageCount

  const run = useCallback(() => {
    setAnimState('running')
    setActiveIndex(0)
    if (intervalRef.current) clearInterval(intervalRef.current)
    let idx = 0
    intervalRef.current = setInterval(() => {
      idx++
      if (idx >= stageCountRef.current) {
        setAnimState('done')
        if (intervalRef.current) clearInterval(intervalRef.current)
        return
      }
      setActiveIndex(idx)
    }, intervalMs)
  }, [intervalMs])

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setActiveIndex(-1)
    setAnimState('idle')
  }, [])

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  return { activeIndex, animState, run, reset }
}
