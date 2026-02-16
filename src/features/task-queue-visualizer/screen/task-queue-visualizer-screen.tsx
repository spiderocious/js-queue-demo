import { useState } from 'react'
import { useExecutionEngine } from '../hooks/use-execution-engine'
import { DEFAULT_DEMO_CODE } from '../helpers/default-demo-code'
import { CodeEditorPanel } from './parts/code-editor-panel'
import { QueueVisualization } from './parts/queue-visualization'
import { ExecutionOutput } from './parts/execution-output'
import { PlaybackControls } from './parts/playback-controls'
import { SummaryPanel } from './parts/summary-panel'

export function TaskQueueVisualizerScreen() {
  const [code, setCode] = useState(DEFAULT_DEMO_CODE)

  const engine = useExecutionEngine(code)

  function handleCodeChange(newCode: string) {
    setCode(newCode)
    engine.loadCode(newCode)
  }

  return (
    <div className="h-full flex flex-col p-3 gap-2 overflow-hidden">
      <SummaryPanel />

      <PlaybackControls
        playbackState={engine.playbackState}
        speed={engine.speed}
        currentStep={engine.currentStepIndex}
        totalSteps={engine.totalSteps}
        onPlay={engine.play}
        onPause={engine.pause}
        onStep={engine.step}
        onReset={engine.reset}
        onSpeedChange={engine.setSpeed}
      />

      <div className="flex-1 grid grid-cols-[1fr_1.2fr_1fr] gap-2 min-h-0">
        <CodeEditorPanel
          code={code}
          onCodeChange={handleCodeChange}
          highlightedLine={engine.queueState.highlightedLine}
        />

        <QueueVisualization queueState={engine.queueState} />

        <ExecutionOutput output={engine.queueState.output} />
      </div>
    </div>
  )
}
