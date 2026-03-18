'use client'
import { useState } from 'react'
import GlowCard from '@/components/common/GlowCard'

const lessons = [
  { id: 'SG01', title: '情報セキュリティの3要素（CIA）', duration: 15, type: 'text', completed: true },
  { id: 'SG02', title: 'リスクマネジメントの基礎', duration: 20, type: 'text', completed: false },
  { id: 'SG03', title: '暗号技術と認証', duration: 25, type: 'quiz', completed: false },
  { id: 'SG04', title: 'ネットワークセキュリティ', duration: 20, type: 'text', completed: false },
  { id: 'SG05', title: '情報セキュリティ関連法規', duration: 15, type: 'text', completed: false },
  { id: 'SG06', title: 'インシデント対応', duration: 20, type: 'quiz', completed: false },
  { id: 'SG07', title: '組織のセキュリティ管理', duration: 15, type: 'text', completed: false },
  { id: 'SG08', title: '模擬試験', duration: 45, type: 'quiz', completed: false },
]

export default function SecurityManagementPage() {
  const completed = lessons.filter(l => l.completed).length
  const progress = Math.round((completed / lessons.length) * 100)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-2xl">📋</div>
        <div>
          <h1 className="text-xl font-bold">情報セキュリティマネジメント試験</h1>
          <p className="text-sm text-cyber-muted">国家試験合格を目指す学習コース</p>
        </div>
      </div>

      <GlowCard hover={false}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm">進捗: {completed}/{lessons.length}</span>
          <span className="text-sm text-cyber-blue font-bold">{progress}%</span>
        </div>
        <div className="w-full h-2 bg-cyber-bg rounded-full">
          <div className="h-full bg-cyber-blue rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex gap-4 mt-3 text-xs text-cyber-muted">
          <span>🔥 連続学習: 1日</span>
          <span>📝 正答率: --</span>
          <span>⏱️ 残り約3.5時間</span>
        </div>
      </GlowCard>

      <div className="space-y-2">
        {lessons.map((lesson, i) => (
          <GlowCard key={lesson.id} className="!p-4">
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                lesson.completed ? 'bg-cyber-green/10 text-cyber-green border border-cyber-green/30' :
                i === completed ? 'bg-cyber-blue/10 text-cyber-blue border border-cyber-blue/30 animate-pulse-glow' :
                'bg-cyber-bg/30 text-cyber-muted border border-cyber-border/30'
              }`}>
                {lesson.completed ? '✓' : i + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{lesson.title}</p>
                <div className="flex items-center gap-3 text-[10px] text-cyber-muted mt-0.5">
                  <span>{lesson.type === 'quiz' ? '📝 クイズ' : '📖 テキスト'}</span>
                  <span>約{lesson.duration}分</span>
                </div>
              </div>
              {lesson.completed && <span className="text-xs text-cyber-green">完了</span>}
            </div>
          </GlowCard>
        ))}
      </div>

      <GlowCard glowColor="cyan" hover={false}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">🤖</span>
          <div>
            <h3 className="text-sm font-semibold text-cyber-glow mb-1">AI学習アドバイス</h3>
            <p className="text-sm">次は「リスクマネジメントの基礎」を学習しましょう。この分野は試験で20%以上の出題率があります。苦手分析に基づき、特にリスクアセスメントの手法を重点的に学ぶことを推奨します。</p>
          </div>
        </div>
      </GlowCard>
    </div>
  )
}
