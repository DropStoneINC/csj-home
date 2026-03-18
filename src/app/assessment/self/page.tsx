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

// Fallback questions if DB is empty or user is not logged in
const fallbackQuestions = [
  { id: 'S01', question_code: 'S01', question_text: 'パスワードを使い回していますか？', category: '認証/ID', weight: 2, sort_order: 1, options_json: { options: [
    { value: 'never', label: '使い回していない', score: 10 },
    { value: 'sometimes', label: '一部使い回している', score: 4 },
    { value: 'always', label: 'ほぼ全て同じ', score: 0 },
  ]}},
  { id: 'S02', question_code: 'S02', question_text: '二要素認証（MFA）を設定していますか？', category: '認証/ID', weight: 2.5, sort_order: 2, options_json: { options: [
    { value: 'all', label: '重要なサービス全てに設定', score: 10 },
    { value: 'some', label: '一部のサービスに設定', score: 5 },
    { value: 'none', label: '設定していない', score: 0 },
  ]}},
  { id: 'S03', question_code: 'S03', question_text: 'フィッシングメールを見分ける自信はありますか？', category: '意識', weight: 1.5, sort_order: 3, options_json: { options: [
    { value: 'high', label: '見分けられる', score: 8 },
    { value: 'medium', label: 'たまに迷う', score: 4 },
    { value: 'low', label: '自信がない', score: 1 },
  ]}},
  { id: 'S04', question_code: 'S04', question_text: 'OSやアプリのアップデートはすぐに適用していますか？', category: '端末', weight: 1.5, sort_order: 4, options_json: { options: [
    { value: 'always', label: 'すぐに適用', score: 10 },
    { value: 'weekly', label: '1週間以内に適用', score: 6 },
    { value: 'delayed', label: '後回しにしがち', score: 2 },
  ]}},
  { id: 'S05', question_code: 'S05', question_text: '公衆Wi-FiでVPNを使っていますか？', category: 'クラウド', weight: 1, sort_order: 5, options_json: { options: [
    { value: 'always', label: '常にVPN使用', score: 10 },
    { value: 'sometimes', label: '時々使用', score: 5 },
    { value: 'never', label: '使っていない', score: 1 },
  ]}},
  { id: 'S06', question_code: 'S06', question_text: 'バックアップを定期的に取っていますか？', category: '端末', weight: 1.5, sort_order: 6, options_json: { options: [
    { value: 'auto', label: '自動バックアップ設定済み', score: 10 },
    { value: 'manual', label: '手動で時々', score: 5 },
    { value: 'never', label: '取っていない', score: 0 },
  ]}},
  { id: 'S07', question_code: 'S07', question_text: '不審なメールやSMSを受信した時どうしますか？', category: '意識', weight: 2, sort_order: 7, options_json: { options: [
    { value: 'report', label: '通報・報告する', score: 10 },
    { value: 'delete', label: '無視して削除する', score: 5 },
    { value: 'open', label: '内容を確認してしまう', score: 0 },
  ]}},
  { id: 'S08', question_code: 'S08', question_text: 'パスワードマネージャーを使用していますか？', category: '認証/ID', weight: 2, sort_order: 8, options_json: { options: [
    { value: 'yes', label: '使用している', score: 10 },
    { value: 'browser', label: 'ブラウザの保存機能のみ', score: 4 },
    { value: 'no', label: '使用していない', score: 0 },
  ]}},
]

export default function SelfAssessmentPage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>(fallbackQuestions as any)
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, { value: string; score: number }>>({})
  const [currentQ, setCurrentQ] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Load questions from DB and check auth
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)

      const { template, questions: dbQuestions } = await fetchAssessmentQuestions('self_basic')
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
        // 1. Create session
        const session = await createAssessmentSession(userId, templateId, 'self')

        if (session) {
          // 2. Save all answers
          const answerRows = Object.entries(answers).map(([qId, a]) => ({
            question_id: qId,
            answer_value: a.value,
            score: a.score,
          }))
          await saveAssessmentAnswers(session.id, answerRows)

          // 3. Complete session
          await completeAssessmentSession(session.id, normalizedScore)

          // 4. Add score event (+5 for completing self assessment)
          await addScoreEvent(userId, 5, '自己診断テスト完了', 'assessment')

          // 5. Recalculate user score
          await recalcUserScore(userId)

          // 6. Log activity
          await logActivity(userId, 'assessment_completed', 'self_assessment', {
            score: normalizedScore,
            session_id: session.id,
          })
        }
        setSaved(true)
      }
    } catch (err) {
      console.error('Error saving assessment:', err)
    } finally {
      setSaving(false)
    }
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
          {saving && <p className="text-xs text-cyber-glow mt-2 animate-pulse">結果を保存中...</p>}
          {saved && <p className="text-xs text-cyber-green mt-2">✓ スコアがダッシュボードに反映されました（+5pt）</p>}
          {!userId && <p className="text-xs text-cyber-yellow mt-2">ログインすると結果が保存されます</p>}
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
                  ? 'まずはパスワードマネージャーの導入とMFAの設定から始めましょう。この2つだけでスコアが大幅に向上します。'
                  : 'メール防御の意識を高め、VPNの常時利用を検討してください。学習コースで実践的な知識を身につけましょう。'}
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
        <h1 className="text-xl font-bold">👤 自己診断テスト</h1>
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
