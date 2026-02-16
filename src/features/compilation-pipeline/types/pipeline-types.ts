export type StageId = 'source' | 'parsing' | 'bytecode' | 'machine' | 'execution'

export interface PipelineStage {
  id: StageId
  title: string
  description: string
  detailedExplanation: string
  color: string
  colorBg: string
  colorBorder: string
  content: string
  optimizationHints: OptimizationHint[]
}

export interface OptimizationHint {
  type: 'optimization' | 'deoptimization'
  label: string
  description: string
}

export type PipelineState = 'idle' | 'compiling' | 'done'
