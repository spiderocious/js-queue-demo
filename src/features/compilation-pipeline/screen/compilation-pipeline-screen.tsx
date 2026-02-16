import { useState } from 'react'
import { Play, RotateCcw, Zap } from '@icons'
import { Show } from 'meemaw'
import { useCompilationPipeline } from '../hooks/use-compilation-pipeline'
import { DEFAULT_COMPILATION_CODE } from '../helpers/default-compilation-code'
import { SourceInput } from './parts/source-input'
import { PipelineFlow } from './parts/pipeline-flow'

export function CompilationPipelineScreen() {
  const [code, setCode] = useState(DEFAULT_COMPILATION_CODE)
  const pipeline = useCompilationPipeline(code)

  function handleCodeChange(newCode: string) {
    setCode(newCode)
    pipeline.loadCode(newCode)
  }

  return (
    <div className="h-full flex flex-col p-3 gap-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-text flex items-center gap-1.5">
            <Zap size={15} className="text-primary" />
            JavaScript Compilation Pipeline
          </h1>
          <p className="text-[10px] text-text-dim mt-0.5">
            How V8 transforms your source code into executable machine code
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <Show when={pipeline.pipelineState !== 'compiling'}>
            <button
              onClick={pipeline.compile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/20 text-primary text-xs font-semibold hover:bg-primary/30 transition-colors"
            >
              <Play size={13} />
              Compile
            </button>
          </Show>

          <Show when={pipeline.pipelineState === 'compiling'}>
            <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-callstack">
              <span className="w-2 h-2 rounded-full bg-callstack animate-pulse" />
              Compiling...
            </span>
          </Show>

          <button
            onClick={() => {
              pipeline.reset()
            }}
            className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-surface-overlay transition-colors"
            title="Reset"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Source code input */}
      <SourceInput code={code} onCodeChange={handleCodeChange} />

      {/* Pipeline stages */}
      <div className="flex-1 overflow-auto">
        <PipelineFlow
          stages={pipeline.stages}
          activeStageIndex={pipeline.activeStageIndex}
        />
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700"
            style={{
              width: `${pipeline.pipelineState === 'idle' ? 0 : pipeline.pipelineState === 'done' ? 100 : ((pipeline.activeStageIndex + 1) / pipeline.stages.length) * 100}%`,
            }}
          />
        </div>
        <span className="text-[10px] font-mono text-text-dim">
          {pipeline.pipelineState === 'idle'
            ? 'Ready'
            : pipeline.pipelineState === 'compiling'
            ? `Stage ${pipeline.activeStageIndex + 1}/${pipeline.stages.length}`
            : 'Complete'}
        </span>
      </div>
    </div>
  )
}
