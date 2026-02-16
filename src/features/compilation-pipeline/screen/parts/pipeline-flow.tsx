import { ArrowRight } from '@icons'
import { Show } from 'meemaw'
import type { PipelineStage as PipelineStageType } from '../../types/pipeline-types'
import { PipelineStage } from './pipeline-stage'

interface PipelineFlowProps {
  stages: PipelineStageType[]
  activeStageIndex: number
}

export function PipelineFlow({ stages, activeStageIndex }: PipelineFlowProps) {
  return (
    <div className="flex items-start gap-2 overflow-x-auto pb-2">
      {stages.map((stage, i) => (
        <div key={stage.id} className="flex items-start gap-2 shrink-0" style={{ width: 'calc(20% - 8px)', minWidth: '200px' }}>
          <div className="flex-1">
            <PipelineStage
              stage={stage}
              isActive={i === activeStageIndex}
              isCompleted={i < activeStageIndex}
              stageIndex={i}
            />
          </div>

          {/* Arrow between stages */}
          <Show when={i < stages.length - 1}>
            <div className="flex items-center pt-8 shrink-0">
              <ArrowRight
                size={16}
                className={`transition-colors duration-500 ${
                  i < activeStageIndex
                    ? 'text-primary'
                    : i === activeStageIndex
                    ? 'text-primary animate-pulse'
                    : 'text-border'
                }`}
              />
            </div>
          </Show>
        </div>
      ))}
    </div>
  )
}
