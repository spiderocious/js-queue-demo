import { useState } from 'react'
import { Monitor } from '@icons'
import { usePipelineAnimation } from '@shared/hooks/use-pipeline-animation'
import { PipelineScreenShell } from '@shared/ui/pipeline-screen-shell'
import { DEFAULT_HTML_INPUT } from '../helpers/default-html-input'
import { generateRenderingStages } from '../helpers/transform-stages'
import { HtmlInputPanel } from './parts/html-input-panel'

export function BrowserRenderingScreen() {
  const [html, setHtml] = useState(DEFAULT_HTML_INPUT)
  const [stages, setStages] = useState(() => generateRenderingStages(html))
  const { activeIndex, animState, run, reset } = usePipelineAnimation(stages.length, 700)

  function handleHtmlChange(newHtml: string) {
    setHtml(newHtml)
    setStages(generateRenderingStages(newHtml))
    reset()
  }

  return (
    <PipelineScreenShell
      title="Browser Rendering Pipeline"
      subtitle="How the browser goes from raw HTML bytes → pixels on screen (Critical Rendering Path)"
      icon={<Monitor size={15} />}
      stages={stages}
      activeIndex={activeIndex}
      animState={animState}
      runLabel="Render"
      onRun={run}
      onReset={reset}
      minCardWidth={200}
      inputSlot={<HtmlInputPanel value={html} onChange={handleHtmlChange} />}
    />
  )
}
