'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getUserScore, getScoreEvents } from '@/lib/db'
import GlowCard from '@/components/common/GlowCard'
import ScoreRing, { getRankInfo } from '@/components/common/ScoreRing'

interface UserScore {
  overall_score: number
  email_security_score: number
  cloud_security_score: number
  identity_score: number
  endpoint_score: number
  awareness_score: number
  incident_response_score: number
  training_score: number
}

interface ScoreEvent {
  id: string
  delta: number
  reason: string
  category: string
  created_at: string
}

const defaultScore: UserScore = {
  overall_score: 0,
  email_security_score: 0,
  cloud_security_score: 0,
  identity_score: 0,
  endpoint_score: 0,
  awareness_score: 0,
  incident_response_score: 0,
  training_score: 0,
}

const improvements = [
  { priority: 1, text: 'SPF/DKIM/DMARCを設定する', category: 'メール', impact: '+15' },
  { priority: 2, text: 'クラウドセキュリティ基礎コースを完了する', category: '教育', impact: '+10' },
  { priority: 3, text: '全アカウントにMFAを設定する', category: '認証', impact: '+12' },
  { priority: 4, text: 'インシデント対応手順書を作成する', category: '体制', impact: '+8' },
]

export default function DashboardPage() {
  const [tab, setTab] = useState<'personal' | 'company'>('personal')
  const [score, setScore] = useState<UserScore>(defaultScore)
  const [events, setEvents] = useState<ScoreEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      setLoggedIn(true)

      const userScore = await getUserScore(user.id)
      if (userScore) setScore(userScore as UserScore)

      const scoreEvents = await getScoreEvents(user.id, 10)
      setEvents(scoreEvents as ScoreEvent[])

      setLoading(false)
    }
    loadData()
  }, [])

  const categoryScores = [
    { label: '認証/ID', score: score.identity_score, icon: '🔑' },
    { label: 'メール防御', score: score.email_security_score, icon: '✉️' },
    { label: 'クラウド設定', score: score.cloud_security_score, icon: '☁️' },
    { label: '端末管理', score: score.endpoint_score, icon: '💻' },
    { label: '通報/検知', score: score.awareness_score, icon: '🚨' },
    { label: '教育/訓練', score: score.training_score, icon: '📚' },
    { label: '対応体制', score: score.incident_response_score, icon: '🏗️' },
  ]

  const formatTime = (ts: string) => {
    const d = new Date(ts)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}分前`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}時間前`
    const days = Math.floor(hours / 24)
    return `${days}日前`
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">スコアダッシュボード</h1>
        <div className="flex bg-cyber-bg/50 rounded-lg p-1">
          <button
            onClick={() => setTab('personal')}
            className={`px-4 py-1.5 text-xs rounded-md transition-all ${tab === 'personal' ? 'bg-cyber-glow/10 text-cyber-glow' : 'text-cyber-muted'}`}
          >
            個人
          </button>
          <button
            onClick={() => setTab('company')}
            className={`px-4 py-1.5 text-xs rounded-md transition-all ${tab === 'company' ? 'bg-cyber-glow/10 text-cyber-glow' : 'text-cyber-muted'}`}
          >
            企業
          </button>
        </div>
      </div>

      {!loggedIn && !loading && (
        <GlowCard hover={false} className="border-yellow-500/20">
          <p className="text-sm text-yellow-400">ログインするとスコアが記録・表示されます。<a href="/login" className="underline ml-1">ログイン →</a></p>
        </GlowCard>
      )}

      {/* Main Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlowCard className="md:col-span-1 flex flex-col items-center justify-center !py-8" hover={false}>
          {loading ? (
            <div className="w-12 h-12 border-2 border-cyber-glow/30 border-t-cyber-glow rounded-full animate-spin" />
          ) : (
            {(() => {
              const info = getRankInfo(score.overall_score)
              return (
                <>
                  <ScoreRing score={score.overall_score} size={140} />
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: info.rank.color + '20', color: info.rank.color, border: `1px solid ${info.rank.color}40` }}>
                      {info.rank.icon} {info.rank.name}
                    </span>
                  </div>
                  <div className="w-full max-w-[180px] mt-2">
                    <div className="h-1.5 bg-cyber-bg/50 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${info.progress * 100}%`, backgroundColor: info.rank.color }} />
                    </div>
                    <p className="text-[10px] text-cyber-muted text-center mt-1">次のランク: {info.nextThreshold.toLocaleString()}pt</p>
                  </div>
                  <p className="text-xs text-cyber-muted mt-1">
                    {events.length > 0 ? `最終更新: ${formatTime(events[0]?.created_at)}` : '診断を受けてスコアを取得しましょう'}
                  </p>
                </>
              )
            })()}
          )}
        </GlowCard>

        <GlowCard className="md:col-span-2" hover={false}>
          <h3 className="text-sm font-semibold mb-4">分野別スコア</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categoryScores.map((cat) => (
              <div key={cat.label} className="text-center">
                <ScoreRing score={cat.score} size={70} strokeWidth={5} compact />
                <p className="text-xs text-cyber-muted mt-1">{cat.icon} {cat.label}</p>
              </div>
            ))}
          </div>
        </GlowCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlowCard hover={false}>
          <h3 className="text-sm font-semibold mb-3">最近のスコア変動</h3>
          {events.length === 0 ? (
            <p className="text-sm text-cyber-muted py-4 text-center">まだスコア変動がありません。<br/>自己診断を受けてスコアを獲得しましょう。</p>
          ) : (
            <div className="space-y-2">
              {events.map((ev) => (
                <div key={ev.id} className="flex items-center gap-3 p-2 rounded-lg bg-cyber-bg/30">
                  <span className={`text-xs font-mono font-bold ${ev.delta > 0 ? 'text-cyber-green' : 'text-cyber-red'}`}>{ev.delta > 0 ? '+' : ''}{ev.delta}</span>
                  <span className="flex-1 text-sm">{ev.reason}</span>
                  <span className="text-[10px] text-cyber-muted">{formatTime(ev.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </GlowCard>

        <GlowCard hover={false}>
          <h3 className="text-sm font-semibold mb-3">🎯 改善優先順位</h3>
          <div className="space-y-2">
            {improvements.map((item) => (
              <div key={item.priority} className="flex items-center gap-3 p-2.5 rounded-lg bg-cyber-bg/30 border border-cyber-border/20">
                <div className="w-6 h-6 rounded-full bg-cyber-glow/10 border border-cyber-glow/30 flex items-center justify-center text-xs text-cyber-glow font-bold">{item.priority}</div>
                <div className="flex-1">
                  <p className="text-sm">{item.text}</p>
                  <p className="text-[10px] text-cyber-muted">{item.category}</p>
                </div>
                <span className="text-xs text-cyber-green font-mono">{item.impact}</span>
              </div>
            ))}
          </div>
        </GlowCard>
      </div>

      <GlowCard glowColor="cyan" hover={false} className="border-cyber-glow/20">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🤖</span>
          <div>
            <h3 className="text-sm font-semibold text-cyber-glow mb-1">AIからの次の一手</h3>
            <p className="text-sm text-cyber-text">
              {(() => {
                const s = score.overall_score
                const info = getRankInfo(s)
                if (s === 0) return 'まずは「自己診断テスト」を受けて、最初のポイントを獲得しましょう。'
                if (s < 10) return `あと${10 - s}ptでTraineeランクに昇格！自社診断も受けてみましょう。`
                if (s < 100) return `現在${info.rank.name}ランク（${s}pt）。Guardianランク（100pt）を目指して学習コースに取り組みましょう。`
                if (s < 300) return `${info.rank.name}ランク到達！Protectorランク（300pt）に向けて脅威通報や演習にも挑戦しましょう。`
                return `${info.rank.name}ランク（${s.toLocaleString()}pt）！次のランクアップ（${info.nextThreshold.toLocaleString()}pt）を目指して継続的に活動しましょう。`
              })()}
            </p>
          </div>
        </div>
      </GlowCard>
    </div>
  )
}
