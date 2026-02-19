import { Play, RotateCcw } from '@icons'
import { Show } from 'meemaw'
import type { PipelineAnimState, GenericPipelineStage } from '@shared/types/pipeline'
import { PipelineFlowViewer } from './pipeline-flow-viewer'

interface PipelineScreenShellProps {
  title: string
  subtitle: string
  icon: React.ReactNode
  stages: GenericPipelineStage[]
  activeIndex: number
  animState: PipelineAnimState
  runLabel?: string
  onRun: () => void
  onReset: () => void
  inputSlot: React.ReactNode
  minCardWidth?: number
}

export function PipelineScreenShell({
  title,
  subtitle,
  icon,
  stages,
  activeIndex,
  animState,
  runLabel = 'Run',
  onRun,
  onReset,
  inputSlot,
  minCardWidth,
}: PipelineScreenShellProps) {
  const progress =
    animState === 'idle'
      ? 0
      : animState === 'done'
      ? 100
      : stages.length > 0
      ? ((activeIndex + 1) / stages.length) * 100
      : 0

  return (
    <div className="h-full flex flex-col p-3 gap-2.5 overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-sm font-bold text-text flex items-center gap-1.5">
            <span className="text-primary">{icon}</span>
            {title}
          </h1>
          <p className="text-[10px] text-text-dim mt-0.5">{subtitle}</p>
        </div>

        <div className="flex items-center gap-1.5">
          <Show when={animState !== 'running'}>
            <button
              onClick={onRun}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/20 text-primary text-xs font-semibold hover:bg-primary/30 transition-colors"
            >
              <Play size={12} />
              {runLabel}
            </button>
          </Show>
          <Show when={animState === 'running'}>
            <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Running…
            </span>
          </Show>
          <button
            onClick={onReset}
            title="Reset"
            className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-surface-overlay transition-colors"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* Input slot */}
      <div className="shrink-0">{inputSlot}</div>

      {/* Pipeline */}
      <div className="flex-1 overflow-auto min-h-0">
        <PipelineFlowViewer stages={stages} activeIndex={activeIndex} minCardWidth={minCardWidth} />
      </div>

      {/* Progress footer */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex-1 h-0.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-text-dim shrink-0">
          {animState === 'idle' ? 'Ready' : animState === 'done' ? 'Done' : `Stage ${activeIndex + 1}/${stages.length}`}
        </span>
      </div>
    </div>
  )
}
