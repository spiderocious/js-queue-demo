import { useState, useRef, useEffect } from 'react'
import { Code, RotateCcw } from '@icons'
import { DEFAULT_HTML_INPUT } from '../../helpers/default-html-input'

interface HtmlInputPanelProps {
  value: string
  onChange: (v: string) => void
}

export function HtmlInputPanel({ value, onChange }: HtmlInputPanelProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { setDraft(value) }, [value])

  function apply() {
    onChange(draft)
    setIsEditing(false)
  }

  return (
    <div className="bg-surface-raised rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold text-text-muted">
          <Code size={11} className="text-indigo-400" />
          HTML Source — paste any HTML to see how the browser processes it
        </span>
        <div className="flex items-center gap-1">
          {isEditing ? (
            <button onClick={apply} className="px-2 py-0.5 text-[10px] font-semibold rounded bg-primary/20 text-primary hover:bg-primary/30 transition-colors">
              Run
            </button>
          ) : (
            <button onClick={() => { setIsEditing(true); setTimeout(() => ref.current?.focus(), 0) }}
              className="px-2 py-0.5 text-[10px] font-medium rounded text-text-muted hover:text-text hover:bg-surface-overlay transition-colors">
              Edit
            </button>
          )}
          <button onClick={() => { onChange(DEFAULT_HTML_INPUT); setDraft(DEFAULT_HTML_INPUT); setIsEditing(false) }}
            title="Reset" className="p-0.5 text-text-dim hover:text-text-muted transition-colors">
            <RotateCcw size={11} />
          </button>
        </div>
      </div>
      <div className="max-h-[140px] overflow-auto">
        {isEditing ? (
          <textarea
            ref={ref}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full min-h-[120px] bg-transparent text-text font-mono text-[10px] leading-5 p-2.5 resize-none outline-none"
            spellCheck={false}
            placeholder="Paste HTML here…"
          />
        ) : (
          <pre className="p-2.5 font-mono text-[10px] leading-5 text-text/80 whitespace-pre-wrap">
            {value.length > 600 ? value.slice(0, 600) + '\n…' : value}
          </pre>
        )}
      </div>
    </div>
  )
}
