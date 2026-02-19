export type BadgeType = 'optimization' | 'warning' | 'blocking' | 'info'

export interface PipelineBadge {
  type: BadgeType
  label: string
  detail: string
}

export interface GenericPipelineStage {
  id: string
  title: string
  description: string
  explanation: string
  colorText: string    // e.g. 'text-emerald-400'
  colorBg: string      // e.g. 'bg-emerald-400/15'
  colorBorder: string  // e.g. 'border-emerald-400/40'
  content: string
  badges: PipelineBadge[]
}

export type PipelineAnimState = 'idle' | 'running' | 'done'
