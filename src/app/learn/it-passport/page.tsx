'use client'
import GlowCard from '@/components/common/GlowCard'

const lessons = [
  { id: 'ITP01', title: '情報セキュリティの概要', duration: 10, type: 'text', completed: true },
  { id: 'ITP02', title: 'サイバー攻撃の種類と対策', duration: 15, type: 'text', completed: true },
  { id: 'ITP03', title: '法規・ガイドライン', duration: 20, type: 'quiz', completed: false },
  { id: 'ITP04', title: '個人情報保護法', duration: 15, type: 'text', completed: false },
  { id: 'ITP05', title: 'セキュリティ技術の基礎', duration: 20, type: 'text', completed: false },
  { id: 'ITP06', title: '確認テスト', duration: 30, type: 'quiz', completed: false },
]

export default function ITPassportPage() {
  const completed = lessons.filter(l => l.completed).length
  const progress = Math.round((completed / lessons.length) * 100)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-center text-2xl">🎓</div>
        <div>
          <h1 className="text-xl font-bold">ITパスポート試験対策</h1>
          <p className="text-sm text-cyber-muted">セキュリティ分野を中心に学習</p>
        </div>
      </div>

      <GlowCard hover={false}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm">進捗: {completed}/{lessons.length}</span>
          <span className="text-sm text-cyber-green font-bold">{progress}%</span>
        </div>
        <div className="w-full h-2 bg-cyber-bg rounded-full">
          <div className="h-full bg-cyber-green rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex gap-4 mt-3 text-xs text-cyber-muted">
          <span>🔥 連続学習: 2日</span>
          <span>📝 正答率: 75%</span>
        </div>
      </GlowCard>

      <div className="space-y-2">
        {lessons.map((lesson, i) => (
          <GlowCard key={lesson.id} className="!p-4">
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                lesson.completed ? 'bg-cyber-green/10 text-cyber-green border border-cyber-green/30' :
                i === completed ? 'bg-green-500/10 text-green-400 border border-green-500/30' :
                'bg-cyber-bg/30 text-cyber-muted border border-cyber-border/30'
              }`}>
                {lesson.completed ? '✓' : i + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{lesson.title}</p>
                <p className="text-[10px] text-cyber-muted">{lesson.type === 'quiz' ? '📝 クイズ' : '📖 テキスト'} • 約{lesson.duration}分</p>
              </div>
              {lesson.completed && <span className="text-xs text-cyber-green">完了</span>}
            </div>
          </GlowCard>
        ))}
      </div>
    </div>
  )
}
