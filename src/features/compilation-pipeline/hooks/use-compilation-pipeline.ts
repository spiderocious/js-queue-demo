import { useState, useCallback, useRef, useEffect } from 'react'
import type { PipelineStage, PipelineState } from '../types/pipeline-types'
import { generatePipelineStages } from '../helpers/transform-stages'

interface CompilationPipeline {
  stages: PipelineStage[]
  activeStageIndex: number
  pipelineState: PipelineState
  compile: () => void
  reset: () => void
  loadCode: (code: string) => void
}

export function useCompilationPipeline(initialCode: string): CompilationPipeline {
  const [stages, setStages] = useState<PipelineStage[]>(() => generatePipelineStages(initialCode))
  const [activeStageIndex, setActiveStageIndex] = useState(-1)
  const [pipelineState, setPipelineState] = useState<PipelineState>('idle')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stageCountRef = useRef(stages.length)

  stageCountRef.current = stages.length

  const compile = useCallback(() => {
    setPipelineState('compiling')
    setActiveStageIndex(0)

    if (intervalRef.current) clearInterval(intervalRef.current)

    let idx = 0
    intervalRef.current = setInterval(() => {
      idx++
      if (idx >= stageCountRef.current) {
        setPipelineState('done')
        if (intervalRef.current) clearInterval(intervalRef.current)
        return
      }
      setActiveStageIndex(idx)
    }, 800)
  }, [])

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setActiveStageIndex(-1)
    setPipelineState('idle')
  }, [])

  const loadCode = useCallback((code: string) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setStages(generatePipelineStages(code))
    setActiveStageIndex(-1)
    setPipelineState('idle')
  }, [])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return {
    stages,
    activeStageIndex,
    pipelineState,
    compile,
    reset,
    loadCode,
  }
}
