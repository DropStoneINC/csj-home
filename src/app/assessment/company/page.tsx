'use client'
import { useState } from 'react'
import GlowCard from '@/components/common/GlowCard'
import CyberButton from '@/components/common/CyberButton'
import ScoreRing from '@/components/common/ScoreRing'

const questions = [
  { id: 'C01', text: '全社員にMFAを義務化していますか？', category: '認証', options: [
    { value: 'mandatory', label: '全員必須', score: 10 },
    { value: 'partial', label: '一部のみ', score: 4 },
    { value: 'none', label: '義務化していない', score: 0 },
  ]},
  { id: 'C02', text: 'SPF/DKIM/DMARC は設定済みですか？', category: 'メール', options: [
    { value: 'all', label: '全て設定済み', score: 10 },
    { value: 'partial', label: '一部設定済み', score: 5 },
    { value: 'none', label: '未設定', score: 0 },
  ]},
  { id: 'C03', text: 'クラウドサービスの権限管理を定期的に見直していますか？', category: 'クラウド', options: [
    { value: 'quarterly', label: '四半期ごとに見直し', score: 10 },
    { value: 'yearly', label: '年1回', score: 5 },
    { value: 'never', label: '見直していない', score: 0 },
  ]},
  { id: 'C04', text: 'セキュリティインシデント対応手順書がありますか？', category: '体制', options: [
    { value: 'documented', label: '手順書があり定期訓練実施', score: 10 },
    { value: 'exists', label: '手順書はあるが訓練未実施', score: 5 },
    { value: 'none', label: '手順書がない', score: 0 },
  ]},
  { id: 'C05', text: '社員へのセキュリティ教育は実施していますか？', category: '教育', options: [
    { value: 'regular', label: '定期的に実施', score: 10 },
    { value: 'onboarding', label: '入社時のみ', score: 4 },
    { value: 'none', label: '実施していない', score: 0 },
  ]},
  { id: 'C06', text: '端末管理（MDM）を導入していますか？', category: '端末', options: [
    { value: 'full', label: '全端末を管理', score: 10 },
    { value: 'partial', label: '一部端末のみ', score: 5 },
    { value: 'none', label: '未導入', score: 0 },
  ]},
]

export default function CompanyAssessmentPage() {
  const [answers, setAnswers] = useState<Record<string, { value: string; score: number }>>({})
  const [currentQ, setCurrentQ] = useState(0)
  const [completed, setCompleted] = useState(false)

  const totalScore = Object.values(answers).reduce((sum, a) => sum + a.score, 0)
  const maxScore = questions.length * 10
  const normalizedScore = Math.round((totalScore / maxScore) * 100)

  const handleAnswer = (qId: string, value: string, score: number) => {
    setAnswers(prev => ({ ...prev, [qId]: { value, score } }))
    if (currentQ < questions.length - 1) {
      setTimeout(() => setCurrentQ(currentQ + 1), 300)
    }
  }

  if (completed) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-xl font-bold">自社診断結果</h1>
        <GlowCard hover={false} className="text-center !py-8">
          <ScoreRing score={normalizedScore} size={160} strokeWidth={10} />
          <p className="text-lg font-bold mt-4">組織セキュリティスコア</p>
          <p className="text-sm text-cyber-muted mt-1">
            {normalizedScore >= 80 ? '優秀な体制です。継続的な改善を続けましょう。' :
             normalizedScore >= 60 ? '基盤はできています。弱点を重点的に強化しましょう。' :
             normalizedScore >= 40 ? '複数の分野で改善が必要です。優先順位をつけて対応しましょう。' :
             'セキュリティ体制の抜本的な見直しが必要です。'}
          </p>
        </GlowCard>

        <GlowCard hover={false}>
          <h3 className="text-sm font-semibold mb-3">カテゴリ別結果</h3>
          {questions.map((q) => {
            const answer = answers[q.id]
            return (
              <div key={q.id} className="flex items-center gap-3 p-2.5 border-b border-cyber-border/20 last:border-0">
                <span className="text-xs bg-cyber-glow/10 text-cyber-glow px-2 py-0.5 rounded">{q.category}</span>
                <span className="flex-1 text-sm">{q.text}</span>
                <span className={`text-xs font-mono font-bold ${(answer?.score || 0) >= 8 ? 'text-cyber-green' : (answer?.score || 0) >= 4 ? 'text-yellow-400' : 'text-cyber-red'}`}>
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
                組織のセキュリティスコアは{normalizedScore}点です。
                改善効果が最も高いのは、メール認証設定（SPF/DKIM/DMARC）の導入と、
                全社員へのMFA義務化です。この2つで約25ポイントの向上が見込めます。
              </p>
            </div>
          </div>
        </GlowCard>

        <div className="flex gap-3">
          <CyberButton onClick={() => { setCompleted(false); setCurrentQ(0); setAnswers({}) }}>もう一度診断</CyberButton>
          <CyberButton variant="secondary" onClick={() => window.location.href = '/dashboard'}>ダッシュボードへ</CyberButton>
        </div>
      </div>
    )
  }

  const q = questions[currentQ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold">🏢 自社診断テスト</h1>
      <div className="w-full h-1.5 bg-cyber-bg rounded-full overflow-hidden">
        <div className="h-full bg-cyber-green rounded-full transition-all duration-500" style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }} />
      </div>

      <GlowCard hover={false} className="!py-8">
        <p className="text-xs text-cyber-green mb-2">{q.category} — 質問 {currentQ + 1}/{questions.length}</p>
        <h2 className="text-lg font-semibold mb-6">{q.text}</h2>
        <div className="space-y-3">
          {q.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleAnswer(q.id, opt.value, opt.score)}
              className={`w-full text-left p-4 rounded-lg border transition-all ${
                answers[q.id]?.value === opt.value
                  ? 'bg-cyber-green/10 border-cyber-green/40 text-cyber-green'
                  : 'bg-cyber-bg/30 border-cyber-border/30 hover:border-cyber-green/20'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </GlowCard>

      <div className="flex justify-between">
        <CyberButton variant="ghost" onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} disabled={currentQ === 0}>← 前へ</CyberButton>
        {currentQ < questions.length - 1 ? (
          <CyberButton onClick={() => setCurrentQ(currentQ + 1)} disabled={!answers[q.id]}>次へ →</CyberButton>
        ) : (
          <CyberButton onClick={() => setCompleted(true)} disabled={Object.keys(answers).length < questions.length}>診断完了</CyberButton>
        )}
      </div>
    </div>
  )
}
