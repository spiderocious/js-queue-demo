import { useState, useRef, useEffect } from 'react'
import { Code, RotateCcw } from '@icons'
import { DEFAULT_COMPILATION_CODE } from '../../helpers/default-compilation-code'

interface SourceInputProps {
  code: string
  onCodeChange: (code: string) => void
}

export function SourceInput({ code, onCodeChange }: SourceInputProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(code)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setEditValue(code)
  }, [code])

  function handleApply() {
    onCodeChange(editValue)
    setIsEditing(false)
  }

  return (
    <div className="flex flex-col bg-surface-raised rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
          <Code size={13} />
          Source Code
        </div>
        <div className="flex items-center gap-1">
          {isEditing ? (
            <button
              onClick={handleApply}
              className="px-2 py-0.5 text-[10px] font-semibold rounded bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
            >
              Apply
            </button>
          ) : (
            <button
              onClick={() => {
                setIsEditing(true)
                setTimeout(() => textareaRef.current?.focus(), 0)
              }}
              className="px-2 py-0.5 text-[10px] font-medium rounded text-text-muted hover:text-text hover:bg-surface-overlay transition-colors"
            >
              Edit
            </button>
          )}
          <button
            onClick={() => {
              onCodeChange(DEFAULT_COMPILATION_CODE)
              setEditValue(DEFAULT_COMPILATION_CODE)
              setIsEditing(false)
            }}
            className="p-0.5 text-text-dim hover:text-text-muted transition-colors"
            title="Reset to default"
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>

      <div className="overflow-auto max-h-[300px]">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full min-h-[200px] bg-transparent text-text font-mono text-xs leading-5 p-3 resize-none outline-none"
            spellCheck={false}
          />
        ) : (
          <pre className="p-3 font-mono text-xs leading-5 text-text/90 whitespace-pre-wrap">
            {code}
          </pre>
        )}
      </div>
    </div>
  )
}
