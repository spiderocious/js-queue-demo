import { ArrowRight } from '@icons'
import { Show } from 'meemaw'
import type { GenericPipelineStage } from '@shared/types/pipeline'
import { PipelineStageCard } from './pipeline-stage-card'

interface PipelineFlowViewerProps {
  stages: GenericPipelineStage[]
  activeIndex: number
  minCardWidth?: number
}

export function PipelineFlowViewer({ stages, activeIndex, minCardWidth = 190 }: PipelineFlowViewerProps) {
  return (
    <div className="flex items-start gap-1.5 overflow-x-auto pb-2">
      {stages.map((stage, i) => (
        <div key={stage.id} className="flex items-start gap-1.5 shrink-0" style={{ minWidth: `${minCardWidth}px` }}>
          <div className="flex-1">
            <PipelineStageCard
              stage={stage}
              isActive={i === activeIndex}
              isCompleted={i < activeIndex}
              index={i}
            />
          </div>

          <Show when={i < stages.length - 1}>
            <div className="flex items-center mt-8 shrink-0">
              <ArrowRight
                size={14}
                className={`transition-colors duration-500 ${
                  i < activeIndex ? 'text-primary' : i === activeIndex ? 'text-primary animate-pulse' : 'text-border'
                }`}
              />
            </div>
          </Show>
        </div>
      ))}
    </div>
  )
}
