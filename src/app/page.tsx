'use client'
import { useState } from 'react'
import Link from 'next/link'
import GlowCard from '@/components/common/GlowCard'
import ScoreRing from '@/components/common/ScoreRing'

const quickActions = [
  { label: '自己診断を始める', href: '/assessment/self', icon: '👤', color: 'cyan' as const },
  { label: '自社診断を始める', href: '/assessment/company', icon: '🏢', color: 'green' as const },
  { label: '脅威を通報する', href: '/threat/report', icon: '🚨', color: 'red' as const },
  { label: '脅威を検索する', href: '/threat/search', icon: '🔎', color: 'cyan' as const },
  { label: '学習を始める', href: '/learn/cloud-security', icon: '📚', color: 'purple' as const },
  { label: 'AIに相談する', href: '/agent', icon: '🤖', color: 'cyan' as const },
]

const todayTasks = [
  { text: 'メール設定の簡易診断を完了する', score: '+8', done: false },
  { text: 'クラウドセキュリティ基礎レッスン1を受講', score: '+2', done: false },
  { text: '不審メールを1件通報する', score: '+3', done: true },
]

export default function HomePage() {
  const [chatInput, setChatInput] = useState('')

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyber-card via-cyber-surface to-cyber-bg border border-cyber-border/50 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyber-glow/5 rounded-full blur-3xl" />
        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
          <ScoreRing score={62} size={100} />
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-1">おかえりなさい</h2>
            <p className="text-cyber-muted text-sm mb-3">
              現在の総合セキュリティスコアは <span className="text-cyber-glow font-bold">62</span> です。
              前回比 <span className="text-cyber-green">+5</span>
            </p>
            <div className="bg-cyber-bg/50 rounded-lg border border-cyber-border/30 p-3">
              <p className="text-xs text-cyber-muted mb-1">🤖 AIからの提案</p>
              <p className="text-sm">メール認証設定が弱いです。まずSPF/DKIM/DMARCの基礎を学びましょう。</p>
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
          {todayTasks.map((task, i) => (
            <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg ${task.done ? 'bg-cyber-green/5' : 'bg-cyber-bg/30'}`}>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs ${task.done ? 'border-cyber-green bg-cyber-green/20 text-cyber-green' : 'border-cyber-border'}`}>
                {task.done && '✓'}
              </div>
              <span className={`flex-1 text-sm ${task.done ? 'text-cyber-muted line-through' : ''}`}>{task.text}</span>
              <span className={`text-xs font-mono ${task.done ? 'text-cyber-green' : 'text-cyber-glow'}`}>{task.score}</span>
            </div>
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
