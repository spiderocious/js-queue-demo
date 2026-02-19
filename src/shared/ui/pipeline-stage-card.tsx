import { useState } from 'react'
import { ChevronDown, ChevronUp, Flame, AlertTriangle, Info, X } from '@icons'
import { Show } from 'meemaw'
import type { GenericPipelineStage } from '@shared/types/pipeline'

interface PipelineStageCardProps {
  stage: GenericPipelineStage
  isActive: boolean
  isCompleted: boolean
  index: number
}

const BADGE_STYLES = {
  optimization: { base: 'bg-primary/15 text-primary border-primary/30', icon: <Flame size={9} /> },
  warning: { base: 'bg-amber-400/15 text-amber-400 border-amber-400/30', icon: <AlertTriangle size={9} /> },
  blocking: { base: 'bg-red-400/15 text-red-400 border-red-400/30', icon: <X size={9} /> },
  info: { base: 'bg-sky-400/15 text-sky-400 border-sky-400/30', icon: <Info size={9} /> },
} as const

export function PipelineStageCard({ stage, isActive, isCompleted, index }: PipelineStageCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const visible = isActive || isCompleted

  return (
    <div
      className={`flex flex-col rounded-lg border ${stage.colorBorder} ${stage.colorBg}
        transition-all duration-500 overflow-hidden
        ${visible ? 'opacity-100' : 'opacity-35'}
        ${isActive ? 'scale-[1.02] shadow-lg' : 'scale-100'}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
        <span
          className={`shrink-0 text-[10px] font-bold ${stage.colorText}
            bg-black/20 rounded-full w-5 h-5 flex items-center justify-center`}
        >
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className={`text-xs font-bold leading-none ${stage.colorText}`}>{stage.title}</h3>
          <p className="text-[10px] text-text-dim mt-0.5 leading-none truncate">{stage.description}</p>
        </div>
        <Show when={isActive}>
          <span className={`shrink-0 w-1.5 h-1.5 rounded-full animate-pulse bg-current ${stage.colorText}`} />
        </Show>
      </div>

      {/* Content area */}
      <Show when={visible}>
        <div className="p-2 overflow-auto max-h-[200px] min-h-[60px]">
          <pre className={`font-mono text-[9px] leading-[14px] text-text/80 whitespace-pre-wrap break-words`}>
            {stage.content.length > 700 ? stage.content.slice(0, 700) + '\n…' : stage.content}
          </pre>
        </div>
      </Show>

      {/* Badges */}
      <Show when={visible && stage.badges.length > 0}>
        <div className="px-2 pb-1.5 flex flex-wrap gap-1">
          {stage.badges.map((badge, i) => {
            const style = BADGE_STYLES[badge.type]
            return (
              <span
                key={i}
                title={badge.detail}
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[9px] font-semibold ${style.base}`}
              >
                {style.icon}
                {badge.label}
              </span>
            )
          })}
        </div>
      </Show>

      {/* Expand toggle */}
      <Show when={visible}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-center gap-1 py-1 border-t border-white/5 text-[10px] text-text-dim hover:text-text-muted transition-colors"
        >
          {isExpanded ? 'Less' : 'What happens here?'}
          {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </button>
        <Show when={isExpanded}>
          <div className="px-3 pb-2.5 animate-[fadeIn_0.2s_ease-out]">
            <p className="text-[10px] text-text-muted leading-relaxed">{stage.explanation}</p>
          </div>
        </Show>
      </Show>
    </div>
  )
}
