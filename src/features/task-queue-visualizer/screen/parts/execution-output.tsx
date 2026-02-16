import { useRef, useEffect } from 'react'
import { Terminal } from '@icons'

interface ExecutionOutputProps {
  output: string[]
}

export function ExecutionOutput({ output }: ExecutionOutputProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [output.length])

  return (
    <div className="flex flex-col h-full bg-surface-raised rounded-lg border border-border overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border">
        <Terminal size={13} className="text-text-muted" />
        <span className="text-xs font-semibold text-text-muted">Console Output</span>
        <span className="ml-auto text-[10px] font-mono text-text-dim">
          {output.length} lines
        </span>
      </div>

      <div className="flex-1 overflow-auto p-2 font-mono text-xs">
        {output.length === 0 ? (
          <p className="text-text-dim text-[10px] italic p-1">
            No output yet. Press Play or Step to begin.
          </p>
        ) : (
          output.map((line, i) => (
            <div
              key={i}
              className="flex items-start gap-2 py-0.5 animate-[fadeIn_0.3s_ease-out]"
            >
              <span className="text-text-dim text-[10px] w-4 text-right shrink-0 select-none">
                {i + 1}
              </span>
              <span className="text-primary-light">&gt;</span>
              <span className="text-text/90">{line}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
