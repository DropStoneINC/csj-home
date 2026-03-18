'use client'
import { useState } from 'react'
import GlowCard from '@/components/common/GlowCard'
import CyberButton from '@/components/common/CyberButton'
import ScoreRing from '@/components/common/ScoreRing'

const questions = [
  { id: 'S01', text: 'パスワードを使い回していますか？', category: '認証/ID', options: [
    { value: 'never', label: '使い回していない', score: 10 },
    { value: 'sometimes', label: '一部使い回している', score: 4 },
    { value: 'always', label: 'ほぼ全て同じ', score: 0 },
  ]},
  { id: 'S02', text: '二要素認証（MFA）を設定していますか？', category: '認証/ID', options: [
    { value: 'all', label: '重要なサービス全てに設定', score: 10 },
    { value: 'some', label: '一部のサービスに設定', score: 5 },
    { value: 'none', label: '設定していない', score: 0 },
  ]},
  { id: 'S03', text: 'フィッシングメールを見分ける自信はありますか？', category: '意識', options: [
    { value: 'high', label: '見分けられる', score: 8 },
    { value: 'medium', label: 'たまに迷う', score: 4 },
    { value: 'low', label: '自信がない', score: 1 },
  ]},
  { id: 'S04', text: 'OSやアプリのアップデートはすぐに適用していますか？', category: '端末', options: [
    { value: 'always', label: 'すぐに適用', score: 10 },
    { value: 'weekly', label: '1週間以内に適用', score: 6 },
    { value: 'delayed', label: '後回しにしがち', score: 2 },
  ]},
  { id: 'S05', text: '公衆Wi-FiでVPNを使っていますか？', category: 'クラウド', options: [
    { value: 'always', label: '常にVPN使用', score: 10 },
    { value: 'sometimes', label: '時々使用', score: 5 },
    { value: 'never', label: '使っていない', score: 1 },
  ]},
  { id: 'S06', text: 'バックアップを定期的に取っていますか？', category: '端末', options: [
    { value: 'auto', label: '自動バックアップ設定済み', score: 10 },
    { value: 'manual', label: '手動で時々', score: 5 },
    { value: 'never', label: '取っていない', score: 0 },
  ]},
  { id: 'S07', text: '不審なメールやSMSを受信した時どうしますか？', category: '意識', options: [
    { value: 'report', label: '通報・報告する', score: 10 },
    { value: 'delete', label: '無視して削除する', score: 5 },
    { value: 'open', label: '内容を確認してしまう', score: 0 },
  ]},
  { id: 'S08', text: 'パスワードマネージャーを使用していますか？', category: '認証/ID', options: [
    { value: 'yes', label: '使用している', score: 10 },
    { value: 'browser', label: 'ブラウザの保存機能のみ', score: 4 },
    { value: 'no', label: '使用していない', score: 0 },
  ]},
]

export default function SelfAssessmentPage() {
  const [answers, setAnswers] = useState<Record<string, { value: string; score: number }>>({})
  const [currentQ, setCurrentQ] = useState(0)
  const [completed, setCompleted] = useState(false)

  const totalScore = Object.values(answers).reduce((sum, a) => sum + a.score, 0)
  const maxScore = questions.length * 10
  const normalizedScore = Math.round((totalScore / maxScore) * 100)
  const progress = (Object.keys(answers).length / questions.length) * 100

  const handleAnswer = (qId: string, value: string, score: number) => {
    setAnswers(prev => ({ ...prev, [qId]: { value, score } }))
    if (currentQ < questions.length - 1) {
      setTimeout(() => setCurrentQ(currentQ + 1), 300)
    }
  }

  const handleComplete = () => {
    setCompleted(true)
  }

  if (completed) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-xl font-bold">自己診断結果</h1>
        <GlowCard hover={false} className="text-center !py-8">
          <ScoreRing score={normalizedScore} size={160} strokeWidth={10} />
          <p className="text-lg font-bold mt-4">あなたのセキュリティスコア</p>
          <p className="text-sm text-cyber-muted mt-1">
            {normalizedScore >= 80 ? '素晴らしい！高いセキュリティ意識です。' :
             normalizedScore >= 60 ? '概ね良好ですが、改善の余地があります。' :
             normalizedScore >= 40 ? 'いくつかの分野で改善が必要です。' :
             'セキュリティ対策を強化しましょう。'}
          </p>
        </GlowCard>

        <GlowCard hover={false}>
          <h3 className="text-sm font-semibold mb-3">回答詳細</h3>
          {questions.map((q) => {
            const answer = answers[q.id]
            const opt = q.options.find(o => o.value === answer?.value)
            return (
              <div key={q.id} className="flex items-center gap-3 p-2.5 border-b border-cyber-border/20 last:border-0">
                <span className="text-xs text-cyber-muted w-16">{q.category}</span>
                <span className="flex-1 text-sm">{q.text}</span>
                <span className="text-xs text-cyber-glow">{opt?.label}</span>
                <span className={`text-xs font-mono ${(answer?.score || 0) >= 8 ? 'text-cyber-green' : (answer?.score || 0) >= 4 ? 'text-cyber-yellow' : 'text-cyber-red'}`}>
                  {answer?.score}/10
                </span>
              </div>
            )
          })}
        </GlowCard>

        <GlowCard glowColor="cyan" hover={false} className="border-cyber-glow/20">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🤖</span>
            <div>
              <h3 className="text-sm font-semibold text-cyber-glow mb-1">AI改善提案</h3>
              <p className="text-sm">
                {normalizedScore < 60
                  ? 'まずはパスワードマネージャーの導入とMFAの設定から始めましょう。この2つだけでスコアが大幅に向上します。'
                  : 'メール防御の意識を高め、VPNの常時利用を検討してください。学習コースで実践的な知識を身につけましょう。'}
              </p>
            </div>
          </div>
        </GlowCard>

        <div className="flex gap-3">
          <CyberButton onClick={() => { setCompleted(false); setCurrentQ(0); setAnswers({}) }}>
            もう一度診断する
          </CyberButton>
          <CyberButton variant="secondary" onClick={() => window.location.href = '/dashboard'}>
            ダッシュボードへ
          </CyberButton>
        </div>
      </div>
    )
  }

  const q = questions[currentQ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">👤 自己診断テスト</h1>
        <span className="text-sm text-cyber-muted">{Object.keys(answers).length}/{questions.length}</span>
      </div>

      {/* Progress */}
      <div className="w-full h-1.5 bg-cyber-bg rounded-full overflow-hidden">
        <div className="h-full bg-cyber-glow rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Question */}
      <GlowCard hover={false} className="!py-8">
        <p className="text-xs text-cyber-glow mb-2">{q.category} — 質問 {currentQ + 1}/{questions.length}</p>
        <h2 className="text-lg font-semibold mb-6">{q.text}</h2>
        <div className="space-y-3">
          {q.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleAnswer(q.id, opt.value, opt.score)}
              className={`w-full text-left p-4 rounded-lg border transition-all ${
                answers[q.id]?.value === opt.value
                  ? 'bg-cyber-glow/10 border-cyber-glow/40 text-cyber-glow'
                  : 'bg-cyber-bg/30 border-cyber-border/30 hover:border-cyber-glow/20 hover:bg-cyber-glow/5'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </GlowCard>

      {/* Navigation */}
      <div className="flex justify-between">
        <CyberButton
          variant="ghost"
          onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
          disabled={currentQ === 0}
        >
          ← 前へ
        </CyberButton>
        {currentQ < questions.length - 1 ? (
          <CyberButton
            onClick={() => setCurrentQ(currentQ + 1)}
            disabled={!answers[q.id]}
          >
            次へ →
          </CyberButton>
        ) : (
          <CyberButton
            onClick={handleComplete}
            disabled={Object.keys(answers).length < questions.length}
          >
            診断完了
          </CyberButton>
        )}
      </div>
    </div>
  )
}
