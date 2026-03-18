'use client'

interface ScoreRingProps {
  score: number
  size?: number
  strokeWidth?: number
  label?: string
}

export default function ScoreRing({ score, size = 120, strokeWidth = 8, label }: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (score / 100) * circumference

  const getColor = (s: number) => {
    if (s >= 80) return '#00ff88'
    if (s >= 60) return '#00f0ff'
    if (s >= 40) return '#ffcc00'
    return '#ff3366'
  }

  const color = getColor(score)

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="score-ring transition-all duration-1000"
            style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>{score}</span>
          <span className="text-[10px] text-cyber-muted">/100</span>
        </div>
      </div>
      {label && <span className="text-xs text-cyber-muted">{label}</span>}
    </div>
  )
}
