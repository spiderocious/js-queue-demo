import { Play, Pause, SkipForward, RotateCcw } from '@icons'

interface PlaybackControlsProps {
  playbackState: 'idle' | 'playing' | 'paused' | 'finished'
  speed: number
  currentStep: number
  totalSteps: number
  onPlay: () => void
  onPause: () => void
  onStep: () => void
  onReset: () => void
  onSpeedChange: (speed: number) => void
}

export function PlaybackControls({
  playbackState,
  speed,
  currentStep,
  totalSteps,
  onPlay,
  onPause,
  onStep,
  onReset,
  onSpeedChange,
}: PlaybackControlsProps) {
  const isPlaying = playbackState === 'playing'
  const isFinished = playbackState === 'finished'
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-surface-raised rounded-lg border border-border">
      {/* Transport buttons */}
      <div className="flex items-center gap-1">
        {isPlaying ? (
          <ControlButton onClick={onPause} title="Pause" active>
            <Pause size={14} />
          </ControlButton>
        ) : (
          <ControlButton onClick={onPlay} title="Play" disabled={isFinished}>
            <Play size={14} />
          </ControlButton>
        )}

        <ControlButton onClick={onStep} title="Step forward" disabled={isFinished}>
          <SkipForward size={14} />
        </ControlButton>

        <ControlButton onClick={onReset} title="Reset">
          <RotateCcw size={13} />
        </ControlButton>
      </div>

      {/* Progress bar */}
      <div className="flex-1 flex items-center gap-2">
        <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-text-dim w-16 text-right">
          {currentStep + 1}/{totalSteps}
        </span>
      </div>

      {/* Speed control */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-text-dim">Speed</span>
        <input
          type="range"
          min={1}
          max={5}
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          className="w-16 h-1 accent-primary"
        />
        <span className="text-[10px] font-mono text-text-muted w-4">{speed}x</span>
      </div>
    </div>
  )
}

function ControlButton({
  children,
  onClick,
  title,
  active = false,
  disabled = false,
}: {
  children: React.ReactNode
  onClick: () => void
  title: string
  active?: boolean
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`p-1.5 rounded-md transition-colors ${
        disabled
          ? 'text-text-dim cursor-not-allowed opacity-40'
          : active
          ? 'bg-primary/20 text-primary'
          : 'text-text-muted hover:text-text hover:bg-surface-overlay'
      }`}
    >
      {children}
    </button>
  )
}
