'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import GlowCard from '@/components/common/GlowCard'
import CyberButton from '@/components/common/CyberButton'
import ScoreRing from '@/components/common/ScoreRing'
import { supabase } from '@/lib/supabase'
import {
  fetchAssessmentQuestions,
  createAssessmentSession,
  saveAssessmentAnswers,
  completeAssessmentSession,
  addScoreEvent,
  recalcUserScore,
  logActivity,
} from '@/lib/db'

interface Question {
  id: string
  question_code: string
  question_text: string
  category: string
  weight: number
  sort_order: number
  options_json: { options: { value: string; label: string; score: number }[] }
}

const fallbackQuestions: Question[] = [
  { id: 'C01', question_code: 'C01', question_text: '全社員にMFAを義務化していますか？', category: '認証', weight: 3, sort_order: 1, options_json: { options: [
    { value: 'mandatory', label: '全員必須', score: 10 },
    { value: 'partial', label: '一部のみ', score: 4 },
    { value: 'none', label: '義務化していない', score: 0 },
  ]}},
  { id: 'C02', question_code: 'C02', question_text: 'SPF/DKIM/DMARC は設定済みですか？', category: 'メール', weight: 3, sort_order: 2, options_json: { options: [
    { value: 'all', label: '全て設定済み', score: 10 },
    { value: 'partial', label: '一部設定済み', score: 5 },
    { value: 'none', label: '未設定', score: 0 },
  ]}},
  { id: 'C03', question_code: 'C03', question_text: 'クラウドサービスの権限管理を定期的に見直していますか？', category: 'クラウド', weight: 2.5, sort_order: 3, options_json: { options: [
    { value: 'quarterly', label: '四半期ごとに見直し', score: 10 },
    { value: 'yearly', label: '年1回', score: 5 },
    { value: 'never', label: '見直していない', score: 0 },
  ]}},
  { id: 'C04', question_code: 'C04', question_text: 'セキュリティインシデント対応手順書がありますか？', category: '体制', weight: 2.5, sort_order: 4, options_json: { options: [
    { value: 'documented', label: '手順書があり定期訓練実施', score: 10 },
    { value: 'exists', label: '手順書はあるが訓練未実施', score: 5 },
    { value: 'none', label: '手順書がない', score: 0 },
  ]}},
  { id: 'C05', question_code: 'C05', question_text: '社員へのセキュリティ教育は実施していますか？', category: '教育', weight: 2, sort_order: 5, options_json: { options: [
    { value: 'regular', label: '定期的に実施', score: 10 },
    { value: 'onboarding', label: '入社時のみ', score: 4 },
    { value: 'none', label: '実施していない', score: 0 },
  ]}},
  { id: 'C06', question_code: 'C06', question_text: '端末管理（MDM）を導入していますか？', category: '端末', weight: 2, sort_order: 6, options_json: { options: [
    { value: 'full', label: '全端末を管理', score: 10 },
    { value: 'partial', label: '一部端末のみ', score: 5 },
    { value: 'none', label: '未導入', score: 0 },
  ]}},
]

export default function CompanyAssessmentPage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>(fallbackQuestions)
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, { value: string; score: number }>>({})
  const [currentQ, setCurrentQ] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)

      const { template, questions: dbQuestions } = await fetchAssessmentQuestions('company_basic')
      if (template && dbQuestions.length > 0) {
        setTemplateId(template.id)
        setQuestions(dbQuestions as Question[])
      }
    }
    init()
  }, [])

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

  const handleComplete = async () => {
    setCompleted(true)
    setSaving(true)

    try {
      if (userId && templateId) {
        const session = await createAssessmentSession(userId, templateId, 'company')

        if (session) {
          const answerRows = Object.entries(answers).map(([qId, a]) => ({
            question_id: qId,
            answer_value: a.value,
            score: a.score,
          }))
          await saveAssessmentAnswers(session.id, answerRows)
          await completeAssessmentSession(session.id, normalizedScore)
          await addScoreEvent(userId, 8, '自社診断テスト完了', 'assessment')
          await recalcUserScore(userId)
          await logActivity(userId, 'assessment_completed', 'company_assessment', {
            score: normalizedScore,
            session_id: session.id,
          })
        }
        setSaved(true)
      }
    } catch (err) {
      console.error('Error saving company assessment:', err)
    } finally {
      setSaving(false)
    }
  }

  if (completed) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-xl font-bold">自社診断結果</h1>
        <GlowCard hover={false} className="text-center !py-8">
          <ScoreRing score={normalizedScore} size={160} strokeWidth={10} />
          <p className="text-lg font-bold mt-4">組織のセキュリティスコア</p>
          <p className="text-sm text-cyber-muted mt-1">
            {normalizedScore >= 80 ? '高いセキュリティ体制が整っています。' :
             normalizedScore >= 60 ? '基本的な対策はありますが、強化が必要です。' :
             normalizedScore >= 40 ? '複数の分野で改善が必要です。' :
             '早急にセキュリティ体制の構築が必要です。'}
          </p>
          {saving && <p className="text-xs text-cyber-glow mt-2 animate-pulse">結果を保存中...</p>}
          {saved && <p className="text-xs text-cyber-green mt-2">✓ スコアがダッシュボードに反映されました（+8pt）</p>}
          {!userId && <p className="text-xs text-yellow-400 mt-2">ログインすると結果が保存されます</p>}
        </GlowCard>

        <GlowCard hover={false}>
          <h3 className="text-sm font-semibold mb-3">回答詳細</h3>
          {questions.map((q) => {
            const answer = answers[q.id]
            const opts = q.options_json?.options || []
            const opt = opts.find((o: any) => o.value === answer?.value)
            return (
              <div key={q.id} className="flex items-center gap-3 p-2.5 border-b border-cyber-border/20 last:border-0">
                <span className="text-xs text-cyber-muted w-16">{q.category}</span>
                <span className="flex-1 text-sm">{q.question_text}</span>
                <span className="text-xs text-cyber-glow">{opt?.label}</span>
                <span className={`text-xs font-mono ${(answer?.score || 0) >= 8 ? 'text-cyber-green' : (answer?.score || 0) >= 4 ? 'text-yellow-400' : 'text-cyber-red'}`}>
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
                  ? 'SPF/DKIM/DMARCのメール認証設定と、全社員へのMFA義務化が最優先です。この2つで組織のリスクを大幅に低減できます。'
                  : 'インシデント対応訓練の定期実施と、クラウド権限の四半期レビューを導入してください。'}
              </p>
            </div>
          </div>
        </GlowCard>

        <div className="flex gap-3">
          <CyberButton onClick={() => { setCompleted(false); setCurrentQ(0); setAnswers({}); setSaved(false) }}>
            もう一度診断する
          </CyberButton>
          <CyberButton variant="secondary" onClick={() => router.push('/dashboard')}>
            ダッシュボードへ
          </CyberButton>
        </div>
      </div>
    )
  }

  const q = questions[currentQ]
  const opts = q?.options_json?.options || []

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">🏢 自社診断テスト</h1>
        <span className="text-sm text-cyber-muted">{Object.keys(answers).length}/{questions.length}</span>
      </div>

      <div className="w-full h-1.5 bg-cyber-bg rounded-full overflow-hidden">
        <div className="h-full bg-cyber-glow rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <GlowCard hover={false} className="!py-8">
        <p className="text-xs text-cyber-glow mb-2">{q.category} — 質問 {currentQ + 1}/{questions.length}</p>
        <h2 className="text-lg font-semibold mb-6">{q.question_text}</h2>
        <div className="space-y-3">
          {opts.map((opt: any) => (
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

      <div className="flex justify-between">
        <CyberButton variant="ghost" onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} disabled={currentQ === 0}>
          ← 前へ
        </CyberButton>
        {currentQ < questions.length - 1 ? (
          <CyberButton onClick={() => setCurrentQ(currentQ + 1)} disabled={!answers[q.id]}>
            次へ →
          </CyberButton>
        ) : (
          <CyberButton onClick={handleComplete} disabled={Object.keys(answers).length < questions.length}>
            診断完了
          </CyberButton>
        )}
      </div>
    </div>
  )
}
