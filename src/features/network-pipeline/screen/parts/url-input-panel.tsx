import { useState } from 'react'
import { Globe } from '@icons'
import { DEFAULT_URL_INPUT } from '../../helpers/default-url-input'

interface UrlInputPanelProps {
  value: string
  onChange: (v: string) => void
}

export function UrlInputPanel({ value, onChange }: UrlInputPanelProps) {
  const [draft, setDraft] = useState(value)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (draft.trim()) onChange(draft.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-surface-raised rounded-lg border border-border px-3 py-2">
      <Globe size={14} className="text-sky-400 shrink-0" />
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="https://example.com/path?query=value"
        className="flex-1 bg-transparent text-text font-mono text-xs outline-none placeholder:text-text-dim"
        spellCheck={false}
      />
      <button
        type="submit"
        className="shrink-0 px-2.5 py-1 text-[10px] font-semibold rounded bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
      >
        Trace
      </button>
      <button
        type="button"
        onClick={() => { setDraft(DEFAULT_URL_INPUT); onChange(DEFAULT_URL_INPUT) }}
        className="shrink-0 text-[10px] text-text-dim hover:text-text-muted transition-colors"
      >
        Reset
      </button>
    </form>
  )
}
