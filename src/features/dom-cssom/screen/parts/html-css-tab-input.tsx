import { useState, useRef } from 'react'
import { FileCode2, RotateCcw } from '@icons'
import { DEFAULT_HTML, DEFAULT_CSS } from '../../helpers/default-dom-input'

interface HtmlCssTabInputProps {
  html: string
  css: string
  onHtmlChange: (v: string) => void
  onCssChange: (v: string) => void
}

type Tab = 'html' | 'css'

export function HtmlCssTabInput({ html, css, onHtmlChange, onCssChange }: HtmlCssTabInputProps) {
  const [activeTab, setActiveTab] = useState<Tab>('html')
  const [htmlDraft, setHtmlDraft] = useState(html)
  const [cssDraft, setCssDraft] = useState(css)
  const [isEditing, setIsEditing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function apply() {
    onHtmlChange(htmlDraft)
    onCssChange(cssDraft)
    setIsEditing(false)
  }

  function reset() {
    setHtmlDraft(DEFAULT_HTML)
    setCssDraft(DEFAULT_CSS)
    onHtmlChange(DEFAULT_HTML)
    onCssChange(DEFAULT_CSS)
    setIsEditing(false)
  }

  const currentValue = activeTab === 'html' ? htmlDraft : cssDraft
  const displayValue = activeTab === 'html' ? html : css

  return (
    <div className="bg-surface-raised rounded-lg border border-border overflow-hidden">
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border">
        <FileCode2 size={11} className="text-cyan-400 mr-1 shrink-0" />
        <button
          onClick={() => setActiveTab('html')}
          className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-colors ${activeTab === 'html' ? 'bg-amber-400/20 text-amber-400' : 'text-text-muted hover:text-text'}`}
        >
          HTML
        </button>
        <button
          onClick={() => setActiveTab('css')}
          className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-colors ${activeTab === 'css' ? 'bg-cyan-400/20 text-cyan-400' : 'text-text-muted hover:text-text'}`}
        >
          CSS
        </button>
        <span className="flex-1" />
        {isEditing ? (
          <button onClick={apply} className="px-2 py-0.5 text-[10px] font-semibold rounded bg-primary/20 text-primary hover:bg-primary/30 transition-colors">
            Apply
          </button>
        ) : (
          <button onClick={() => { setIsEditing(true); setTimeout(() => textareaRef.current?.focus(), 0) }}
            className="px-2 py-0.5 text-[10px] font-medium rounded text-text-muted hover:text-text hover:bg-surface-overlay transition-colors">
            Edit
          </button>
        )}
        <button onClick={reset} title="Reset to defaults" className="p-0.5 text-text-dim hover:text-text-muted transition-colors">
          <RotateCcw size={11} />
        </button>
      </div>
      <div className="max-h-[130px] overflow-auto">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={currentValue}
            onChange={(e) => activeTab === 'html' ? setHtmlDraft(e.target.value) : setCssDraft(e.target.value)}
            className="w-full min-h-[110px] bg-transparent text-text font-mono text-[10px] leading-5 p-2.5 resize-none outline-none"
            spellCheck={false}
          />
        ) : (
          <pre className="p-2.5 font-mono text-[10px] leading-5 text-text/80 whitespace-pre-wrap">
            {displayValue.length > 500 ? displayValue.slice(0, 500) + '\n…' : displayValue}
          </pre>
        )}
      </div>
    </div>
  )
}
