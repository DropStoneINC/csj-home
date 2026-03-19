'use client'

// ─── Rank System ───
// 10 → 100 → 300 → 500 → 1,000 → 2,000 → 3,000 → ...（以降1,000刻み）
const RANK_THRESHOLDS = [0, 10, 100, 300, 500, 1000]

export function getRankInfo(score: number) {
  // 1,000以上は1,000刻みで無限ランクアップ
  let thresholds = [...RANK_THRESHOLDS]
  while (thresholds[thresholds.length - 1] < score) {
    thresholds.push(thresholds[thresholds.length - 1] + 1000)
  }
  // 次の閾値がちょうどscoreと同じ場合、もう1つ追加
  if (thresholds[thresholds.length - 1] === score && score >= 1000) {
    thresholds.push(thresholds[thresholds.length - 1] + 1000)
  }

  let rankIndex = 0
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (score >= thresholds[i]) {
      rankIndex = i
      break
    }
  }

  const currentThreshold = thresholds[rankIndex]
  const nextThreshold = thresholds[rankIndex + 1] ?? currentThreshold + 1000
  const progress = nextThreshold > currentThreshold
    ? (score - currentThreshold) / (nextThreshold - currentThreshold)
    : 1

  const ranks = [
    { name: 'Rookie',     icon: '🛡️', color: '#ff3366', level: 0 },
    { name: 'Trainee',    icon: '⚔️', color: '#ff8844', level: 1 },
    { name: 'Guardian',   icon: '🔰', color: '#ffcc00', level: 2 },
    { name: 'Protector',  icon: '🛡️', color: '#00f0ff', level: 3 },
    { name: 'Sentinel',   icon: '🏅', color: '#00ddff', level: 4 },
    { name: 'Commander',  icon: '⭐', color: '#00ff88', level: 5 },
  ]

  // 5以上はCommander+の多段階
  const rank = rankIndex < ranks.length
    ? ranks[rankIndex]
    : { name: `Commander+${rankIndex - 5}`, icon: '💎', color: '#00ff88', level: rankIndex }

  return { rank, progress, currentThreshold, nextThreshold, rankIndex }
}

// ─── Component ───

interface ScoreRingProps {
  score: number
  size?: number
  strokeWidth?: number
  label?: string
  compact?: boolean
}

export default function ScoreRing({ score, size = 120, strokeWidth = 8, label, compact = false }: ScoreRingProps) {
  const { rank, progress } = getRankInfo(score)
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - progress * circumference

  const color = rank.color

  const scoreFontSize = compact
    ? size * 0.2
    : size <= 80 ? size * 0.22 : size * 0.2

  return (
    <div className="flex flex-col items-center gap-1">
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
          {!compact && <span style={{ fontSize: size * 0.14 }}>{rank.icon}</span>}
          <span className="font-bold tabular-nums" style={{ color, fontSize: scoreFontSize }}>{score.toLocaleString()}</span>
          <span className="text-cyber-muted leading-none" style={{ fontSize: Math.max(8, size * 0.08) }}>pt</span>
        </div>
      </div>
      {!compact && (
        <span className="text-xs font-semibold" style={{ color }}>{rank.name}</span>
      )}
      {label && <span className="text-xs text-cyber-muted">{label}</span>}
    </div>
  )
}
