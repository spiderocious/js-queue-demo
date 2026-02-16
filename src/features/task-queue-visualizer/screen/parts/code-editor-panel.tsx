import { useState, useRef, useEffect } from 'react'
import { Code, RotateCcw, X } from '@icons'
import { DEFAULT_DEMO_CODE } from '../../helpers/default-demo-code'

interface CodeEditorPanelProps {
  code: string
  onCodeChange: (code: string) => void
  highlightedLine: number | null
}

export function CodeEditorPanel({ code, onCodeChange, highlightedLine }: CodeEditorPanelProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(code)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setEditValue(code)
  }, [code])

  useEffect(() => {
    if (highlightedLine !== null && lineContainerRef.current) {
      const lineEl = lineContainerRef.current.querySelector(`[data-line="${highlightedLine}"]`)
      if (lineEl) {
        lineEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [highlightedLine])

  const lines = code.split('\n')

  function handleApplyCode() {
    onCodeChange(editValue)
    setIsEditing(false)
  }

  function handleResetToDefault() {
    onCodeChange(DEFAULT_DEMO_CODE)
    setEditValue(DEFAULT_DEMO_CODE)
    setIsEditing(false)
  }

  function handleClear() {
    setEditValue('')
    setIsEditing(true)
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  return (
    <div className="flex flex-col h-full bg-surface-raised rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
          <Code size={13} />
          Source Code
        </div>
        <div className="flex items-center gap-1">
          {isEditing ? (
            <button
              onClick={handleApplyCode}
              className="px-2 py-0.5 text-[10px] font-semibold rounded bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
            >
              Run
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="px-2 py-0.5 text-[10px] font-medium rounded text-text-muted hover:text-text hover:bg-surface-overlay transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleClear}
                className="p-0.5 text-text-dim hover:text-text-muted transition-colors"
                title="Clear code"
              >
                <X size={12} />
              </button>
            </>
          )}
          <button
            onClick={handleResetToDefault}
            className="p-0.5 text-text-dim hover:text-text-muted transition-colors"
            title="Reset to default"
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full h-full bg-transparent text-text font-mono text-xs leading-5 p-3 resize-none outline-none"
            spellCheck={false}
            placeholder="Paste your JavaScript code here..."
          />
        ) : (
          <div ref={lineContainerRef} className="p-1">
            {lines.map((line, i) => {
              const lineNum = i + 1
              const isHighlighted = highlightedLine === lineNum
              return (
                <div
                  key={i}
                  data-line={lineNum}
                  className={`flex font-mono text-xs leading-5 rounded transition-colors duration-300 ${
                    isHighlighted ? 'bg-primary/15' : ''
                  }`}
                >
                  <span className="w-8 text-right pr-2 text-text-dim select-none shrink-0 text-[10px] leading-5">
                    {lineNum}
                  </span>
                  <pre className="whitespace-pre text-text/90 flex-1">
                    {line || ' '}
                  </pre>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
