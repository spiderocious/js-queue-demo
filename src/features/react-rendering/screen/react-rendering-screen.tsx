import { useState } from 'react'
import { Atom } from '@icons'
import { usePipelineAnimation } from '@shared/hooks/use-pipeline-animation'
import { PipelineScreenShell } from '@shared/ui/pipeline-screen-shell'
import { DEFAULT_JSX_INPUT } from '../helpers/default-jsx-input'
import { generateReactStages } from '../helpers/transform-stages'
import { JsxInputPanel } from './parts/jsx-input-panel'

export function ReactRenderingScreen() {
  const [jsx, setJsx] = useState(DEFAULT_JSX_INPUT)
  const [stages, setStages] = useState(() => generateReactStages(jsx))
  const { activeIndex, animState, run, reset } = usePipelineAnimation(stages.length, 750)

  function handleJsxChange(newJsx: string) {
    setJsx(newJsx)
    setStages(generateReactStages(newJsx))
    reset()
  }

  return (
    <PipelineScreenShell
      title="React Rendering & Reconciliation"
      subtitle="JSX → Babel transform → React elements → Fiber tree → Reconciliation → Commit → Effects → Paint"
      icon={<Atom size={15} />}
      stages={stages}
      activeIndex={activeIndex}
      animState={animState}
      runLabel="Render"
      onRun={run}
      onReset={reset}
      minCardWidth={200}
      inputSlot={<JsxInputPanel value={jsx} onChange={handleJsxChange} />}
    />
  )
}
