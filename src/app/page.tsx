'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import GlowCard from '@/components/common/GlowCard'
import ScoreRing, { getRankInfo } from '@/components/common/ScoreRing'
import { supabase } from '@/lib/supabase'
import { getUserScore, getScoreEvents } from '@/lib/db'

const quickActions = [
  { label: '自己診断を始める', href: '/assessment/self', icon: '👤', color: 'cyan' as const },
  { label: '自社診断を始める', href: '/assessment/company', icon: '🏢', color: 'green' as const },
  { label: '脅威を通報する', href: '/threat/report', icon: '🚨', color: 'red' as const },
  { label: '脅威を検索する', href: '/threat/search', icon: '🔎', color: 'cyan' as const },
  { label: '学習を始める', href: '/learn/cloud-security', icon: '📚', color: 'purple' as const },
  { label: 'AIに相談する', href: '/agent', icon: '🤖', color: 'cyan' as const },
]

export default function HomePage() {
  const [chatInput, setChatInput] = useState('')
  const [score, setScore] = useState(0)
  const [displayName, setDisplayName] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [lastDelta, setLastDelta] = useState<number | null>(null)
  const [aiTip, setAiTip] = useState('ログインして診断を受けると、AIがあなたに合った改善提案をします。')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setLoggedIn(true)

      // Get profile name
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single()
      if (profile) setDisplayName(profile.display_name || '')

      // Get score
      const userScore = await getUserScore(user.id)
      if (userScore) setScore(userScore.overall_score || 0)

      // Get latest event for delta
      const events = await getScoreEvents(user.id, 1)
      if (events.length > 0) setLastDelta(events[0].delta)

      // Dynamic AI tip based on rank
      const s = userScore?.overall_score || 0
      const { rank } = getRankInfo(s)
      if (s === 0) {
        setAiTip('まずは「自己診断テスト」を受けて、最初のポイントを獲得しましょう。')
      } else if (s < 10) {
        setAiTip(`あと${10 - s}ptでTraineeランクに昇格！自社診断も受けてみましょう。`)
      } else if (s < 100) {
        setAiTip(`現在${rank.name}ランク！Guardianランク（100pt）を目指して学習コースに取り組みましょう。`)
      } else if (s < 300) {
        setAiTip(`${rank.name}ランク到達！Protectorランク（300pt）に向けて脅威通報や演習にも挑戦しましょう。`)
      } else if (s < 1000) {
        setAiTip(`${rank.name}ランク！Commanderランク（1,000pt）到達で最高位に。実践力を高めていきましょう。`)
      } else {
        setAiTip(`${rank.name}ランク到達！次のランクアップは${(Math.floor(s / 1000) + 1) * 1000}pt。継続的な活動がさらなる強化につながります。`)
      }
    }
    load()
  }, [])

  // Task completion based on score
  const tasks = [
    { text: '自己診断テストを完了する', score_label: '+5', done: score >= 5, href: '/assessment/self' },
    { text: '自社診断テストを完了する', score_label: '+8', done: score >= 13, href: '/assessment/company' },
    { text: 'メール/クラウド簡易診断を実施する', score_label: '+8', done: false, href: '/assessment/email-cloud' },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyber-card via-cyber-surface to-cyber-bg border border-cyber-border/50 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyber-glow/5 rounded-full blur-3xl" />
        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
          <ScoreRing score={score} size={100} />
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-1">
              {loggedIn ? `おかえりなさい${displayName ? `、${displayName}さん` : ''}` : 'Cyber Shield Agent へようこそ'}
            </h2>
            <p className="text-cyber-muted text-sm mb-1">
              {loggedIn
                ? <>累計 <span className="text-cyber-glow font-bold">{score.toLocaleString()}</span> pt{lastDelta !== null && <> ／前回 <span className={lastDelta > 0 ? 'text-cyber-green' : 'text-cyber-red'}>{lastDelta > 0 ? '+' : ''}{lastDelta}</span></>}</>
                : <><a href="/login" className="text-cyber-glow underline">ログイン</a>してスコアを記録しましょう</>
              }
            </p>
            {loggedIn && (() => {
              const info = getRankInfo(score)
              return (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: info.rank.color + '20', color: info.rank.color, border: `1px solid ${info.rank.color}40` }}>
                    {info.rank.icon} {info.rank.name}
                  </span>
                  <div className="flex-1 max-w-[160px] h-1.5 bg-cyber-bg/50 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${info.progress * 100}%`, backgroundColor: info.rank.color }} />
                  </div>
                  <span className="text-[10px] text-cyber-muted">次 {info.nextThreshold.toLocaleString()}pt</span>
                </div>
              )
            })()}
            <div className="bg-cyber-bg/50 rounded-lg border border-cyber-border/30 p-3">
              <p className="text-xs text-cyber-muted mb-1">🤖 AIからの提案</p>
              <p className="text-sm">{aiTip}</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Chat Quick Input */}
      <GlowCard className="!p-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <input
            type="text"
            placeholder="何から始めればいい？ / このメール怪しい？ / うちの会社の弱点は？"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="flex-1 bg-cyber-bg/50 border border-cyber-border/50 rounded-lg px-4 py-2.5 text-sm text-cyber-text placeholder-cyber-muted/50 focus:outline-none focus:border-cyber-glow/50 transition-all"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && chatInput.trim()) {
                window.location.href = `/agent?q=${encodeURIComponent(chatInput)}`
              }
            }}
          />
          <Link
            href={`/agent${chatInput ? `?q=${encodeURIComponent(chatInput)}` : ''}`}
            className="px-4 py-2.5 bg-cyber-glow/10 text-cyber-glow border border-cyber-glow/30 rounded-lg text-sm font-medium hover:bg-cyber-glow/20 transition-all"
          >
            送信
          </Link>
        </div>
      </GlowCard>

      {/* Today's Tasks */}
      <GlowCard hover={false}>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <span>📋</span> 今日のタスク
        </h3>
        <div className="space-y-2">
          {tasks.map((task, i) => (
            <Link key={i} href={task.href}>
              <div className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${task.done ? 'bg-cyber-green/5' : 'bg-cyber-bg/30 hover:bg-cyber-bg/50'}`}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs ${task.done ? 'border-cyber-green bg-cyber-green/20 text-cyber-green' : 'border-cyber-border'}`}>
                  {task.done && '✓'}
                </div>
                <span className={`flex-1 text-sm ${task.done ? 'text-cyber-muted line-through' : ''}`}>{task.text}</span>
                <span className={`text-xs font-mono ${task.done ? 'text-cyber-green' : 'text-cyber-glow'}`}>{task.score_label}</span>
              </div>
            </Link>
          ))}
        </div>
      </GlowCard>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-cyber-muted">クイックアクション</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <GlowCard glowColor={action.color} className="!p-4 text-center">
                <div className="text-2xl mb-2">{action.icon}</div>
                <p className="text-xs font-medium">{action.label}</p>
              </GlowCard>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
