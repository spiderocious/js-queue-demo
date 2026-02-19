import { useState } from 'react'
import { Globe } from '@icons'
import { usePipelineAnimation } from '@shared/hooks/use-pipeline-animation'
import { PipelineScreenShell } from '@shared/ui/pipeline-screen-shell'
import { DEFAULT_URL_INPUT } from '../helpers/default-url-input'
import { generateNetworkStages } from '../helpers/transform-stages'
import { UrlInputPanel } from './parts/url-input-panel'

export function NetworkPipelineScreen() {
  const [url, setUrl] = useState(DEFAULT_URL_INPUT)
  const [stages, setStages] = useState(() => generateNetworkStages(url))
  const { activeIndex, animState, run, reset } = usePipelineAnimation(stages.length, 800)

  function handleUrlChange(newUrl: string) {
    setUrl(newUrl)
    setStages(generateNetworkStages(newUrl))
    reset()
  }

  return (
    <PipelineScreenShell
      title="Network / URL Request Pipeline"
      subtitle="Full journey: URL entered → DNS → TCP → TLS → HTTP → Server → Response → Browser"
      icon={<Globe size={15} />}
      stages={stages}
      activeIndex={activeIndex}
      animState={animState}
      runLabel="Trace"
      onRun={run}
      onReset={reset}
      minCardWidth={195}
      inputSlot={<UrlInputPanel value={url} onChange={handleUrlChange} />}
    />
  )
}
