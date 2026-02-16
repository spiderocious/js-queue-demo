import { useState } from 'react'
import { ChevronDown, ChevronUp, Flame, AlertTriangle } from '@icons'
import { Show } from 'meemaw'
import type { PipelineStage as PipelineStageType } from '../../types/pipeline-types'

interface PipelineStageProps {
  stage: PipelineStageType
  isActive: boolean
  isCompleted: boolean
  stageIndex: number
}

export function PipelineStage({ stage, isActive, isCompleted, stageIndex }: PipelineStageProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const opacity = isActive || isCompleted ? 'opacity-100' : 'opacity-40'
  const scale = isActive ? 'scale-[1.02]' : 'scale-100'

  return (
    <div
      className={`flex flex-col rounded-lg border ${stage.colorBorder} ${stage.colorBg}
        transition-all duration-500 ${opacity} ${scale} overflow-hidden`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold ${stage.color} bg-surface/40 rounded-full w-5 h-5 flex items-center justify-center`}>
            {stageIndex + 1}
          </span>
          <div>
            <h3 className={`text-xs font-bold ${stage.color}`}>{stage.title}</h3>
            <p className="text-[10px] text-text-dim">{stage.description}</p>
          </div>
        </div>

        {/* Active indicator */}
        <Show when={isActive}>
          <span className={`w-2 h-2 rounded-full ${stage.color.replace('text-', 'bg-')} animate-pulse`} />
        </Show>
      </div>

      {/* Content */}
      <Show when={isActive || isCompleted}>
        <div className="p-2 overflow-auto max-h-[180px]">
          <pre className="font-mono text-[10px] leading-4 text-text/80 whitespace-pre-wrap break-words">
            {stage.content.slice(0, 600)}
            {stage.content.length > 600 ? '\n...' : ''}
          </pre>
        </div>
      </Show>

      {/* Optimization hints */}
      <Show when={(isActive || isCompleted) && stage.optimizationHints.length > 0}>
        <div className="px-2 pb-2 flex flex-wrap gap-1">
          {stage.optimizationHints.map((hint, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                hint.type === 'optimization'
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'bg-callstack/15 text-callstack border border-callstack/30'
              }`}
              title={hint.description}
            >
              {hint.type === 'optimization' ? <Flame size={9} /> : <AlertTriangle size={9} />}
              {hint.label}
            </span>
          ))}
        </div>
      </Show>

      {/* Expandable explanation */}
      <Show when={isActive || isCompleted}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-center gap-1 px-2 py-1 border-t border-border/20 text-[10px] text-text-dim hover:text-text-muted transition-colors"
        >
          {isExpanded ? 'Less' : 'Learn more'}
          {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </button>

        <Show when={isExpanded}>
          <div className="px-3 pb-2">
            <p className="text-[10px] text-text-muted leading-relaxed">
              {stage.detailedExplanation}
            </p>
          </div>
        </Show>
      </Show>
    </div>
  )
}
