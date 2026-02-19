import { useState } from 'react'
import { FileCode2 } from '@icons'
import { usePipelineAnimation } from '@shared/hooks/use-pipeline-animation'
import { PipelineScreenShell } from '@shared/ui/pipeline-screen-shell'
import { DEFAULT_HTML, DEFAULT_CSS } from '../helpers/default-dom-input'
import { generateDomCssomStages } from '../helpers/transform-stages'
import { HtmlCssTabInput } from './parts/html-css-tab-input'

export function DomCssomScreen() {
  const [html, setHtml] = useState(DEFAULT_HTML)
  const [css, setCss] = useState(DEFAULT_CSS)
  const [stages, setStages] = useState(() => generateDomCssomStages(html, css))
  const { activeIndex, animState, run, reset } = usePipelineAnimation(stages.length, 750)

  function handleChange(newHtml: string, newCss: string) {
    setHtml(newHtml)
    setCss(newCss)
    setStages(generateDomCssomStages(newHtml, newCss))
    reset()
  }

  return (
    <PipelineScreenShell
      title="DOM / CSSOM Parsing"
      subtitle="How HTML + CSS bytes become structured trees: bytes → tokens → DOM / CSSOM → render tree"
      icon={<FileCode2 size={15} />}
      stages={stages}
      activeIndex={activeIndex}
      animState={animState}
      runLabel="Parse"
      onRun={run}
      onReset={reset}
      minCardWidth={200}
      inputSlot={
        <HtmlCssTabInput
          html={html}
          css={css}
          onHtmlChange={(v) => handleChange(v, css)}
          onCssChange={(v) => handleChange(html, v)}
        />
      }
    />
  )
}
