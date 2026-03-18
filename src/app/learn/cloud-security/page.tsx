'use client'
import { useState } from 'react'
import GlowCard from '@/components/common/GlowCard'
import CyberButton from '@/components/common/CyberButton'

const lessons = [
  { id: 'ACS01', title: 'クラウドセキュリティの基礎概念', duration: 15, type: 'text', completed: true },
  { id: 'ACS02', title: '責任共有モデルとは', duration: 10, type: 'text', completed: true },
  { id: 'ACS03', title: 'IAMとアクセス制御の基礎', duration: 20, type: 'quiz', completed: false },
  { id: 'ACS04', title: 'データ暗号化の実践', duration: 15, type: 'text', completed: false },
  { id: 'ACS05', title: 'ネットワークセキュリティグループ', duration: 20, type: 'text', completed: false },
  { id: 'ACS06', title: 'ログ監視とアラート設定', duration: 25, type: 'quiz', completed: false },
  { id: 'ACS07', title: 'コンプライアンスとガバナンス', duration: 15, type: 'text', completed: false },
  { id: 'ACS08', title: '総合確認テスト', duration: 30, type: 'quiz', completed: false },
]

const quizQuestions = [
  {
    q: 'クラウドの責任共有モデルにおいて、一般的にユーザーの責任となるのはどれですか？',
    options: ['物理サーバーの管理', 'データセンターの空調', 'アクセス制御の設定', 'ネットワークインフラの管理'],
    answer: 2,
  },
  {
    q: 'IAMのベストプラクティスとして正しいのはどれですか？',
    options: ['全員に管理者権限を付与', '最小権限の原則を適用', 'パスワードは共有する', 'MFAは不要'],
    answer: 1,
  },
]

export default function CloudSecurityPage() {
  const [activeLesson, setActiveLesson] = useState<string | null>(null)
  const [quizStep, setQuizStep] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({})

  const completed = lessons.filter(l => l.completed).length
  const progress = Math.round((completed / lessons.length) * 100)

  if (activeLesson === 'ACS03') {
    const q = quizQuestions[quizStep]
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <CyberButton variant="ghost" onClick={() => setActiveLesson(null)}>← 戻る</CyberButton>
          <h1 className="text-lg font-bold">IAMとアクセス制御クイズ</h1>
        </div>
        <div className="w-full h-1.5 bg-cyber-bg rounded-full">
          <div className="h-full bg-cyber-purple rounded-full transition-all" style={{ width: `${((quizStep + 1) / quizQuestions.length) * 100}%` }} />
        </div>
        <GlowCard hover={false} glowColor="purple" className="!py-8">
          <p className="text-xs text-cyber-purple mb-3">問題 {quizStep + 1}/{quizQuestions.length}</p>
          <h2 className="text-base font-semibold mb-6">{q.q}</h2>
          <div className="space-y-3">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => {
                  setQuizAnswers(prev => ({ ...prev, [quizStep]: i }))
                  if (quizStep < quizQuestions.length - 1) {
                    setTimeout(() => setQuizStep(quizStep + 1), 500)
                  }
                }}
                className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${
                  quizAnswers[quizStep] === i
                    ? i === q.answer ? 'bg-cyber-green/10 border-cyber-green/40 text-cyber-green' : 'bg-cyber-red/10 border-cyber-red/40 text-cyber-red'
                    : 'bg-cyber-bg/30 border-cyber-border/30 hover:border-cyber-purple/30'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          {quizAnswers[quizStep] !== undefined && quizAnswers[quizStep] !== q.answer && (
            <div className="mt-4 p-3 bg-cyber-glow/5 rounded-lg border border-cyber-glow/20">
              <p className="text-xs text-cyber-glow">🤖 正解は「{q.options[q.answer]}」です。{q.answer === 1 ? '最小権限の原則は、ユーザーに業務に必要な最低限の権限のみを付与する考え方です。' : 'クラウドでは、アクセス制御の設定はユーザーの責任です。'}</p>
            </div>
          )}
        </GlowCard>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-2xl">☁️</div>
        <div>
          <h1 className="text-xl font-bold">AIクラウドセキュリティ</h1>
          <p className="text-sm text-cyber-muted">クラウドセキュリティの基礎から実践まで</p>
        </div>
      </div>

      <GlowCard hover={false} glowColor="purple">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm">進捗: {completed}/{lessons.length} レッスン</span>
          <span className="text-sm text-cyber-purple font-bold">{progress}%</span>
        </div>
        <div className="w-full h-2 bg-cyber-bg rounded-full">
          <div className="h-full bg-cyber-purple rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-cyber-muted mt-2">🔥 連続学習: 3日</p>
      </GlowCard>

      <div className="space-y-2">
        {lessons.map((lesson, i) => (
          <GlowCard
            key={lesson.id}
            glowColor="purple"
            onClick={() => setActiveLesson(lesson.id)}
            className="!p-4"
          >
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                lesson.completed ? 'bg-cyber-green/10 text-cyber-green border border-cyber-green/30' :
                i === completed ? 'bg-cyber-purple/10 text-cyber-purple border border-cyber-purple/30' :
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
    </div>
  )
}
