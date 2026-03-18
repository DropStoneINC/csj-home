'use client'
import { useState } from 'react'
import GlowCard from '@/components/common/GlowCard'
import ScoreRing from '@/components/common/ScoreRing'

const categoryScores = [
  { label: '認証/ID', score: 70, icon: '🔑' },
  { label: 'メール防御', score: 45, icon: '✉️' },
  { label: 'クラウド設定', score: 55, icon: '☁️' },
  { label: '端末管理', score: 60, icon: '💻' },
  { label: '通報/検知', score: 80, icon: '🚨' },
  { label: '教育/訓練', score: 35, icon: '📚' },
  { label: '対応体制', score: 50, icon: '🏗️' },
]

const recentEvents = [
  { type: '自己診断完了', delta: '+5', time: '2時間前', module: 'assessment' },
  { type: '学習レッスン完了', delta: '+2', time: '3時間前', module: 'learning' },
  { type: '脅威通報', delta: '+3', time: '昨日', module: 'threat' },
  { type: 'MFA未設定検出', delta: '-10', time: '3日前', module: 'assessment' },
  { type: 'ペンテスト演習クリア', delta: '+5', time: '5日前', module: 'simulation' },
]

const improvements = [
  { priority: 1, text: 'SPF/DKIM/DMARCを設定する', category: 'メール', impact: '+15' },
  { priority: 2, text: 'クラウドセキュリティ基礎コースを完了する', category: '教育', impact: '+10' },
  { priority: 3, text: '全アカウントにMFAを設定する', category: '認証', impact: '+12' },
  { priority: 4, text: 'インシデント対応手順書を作成する', category: '体制', impact: '+8' },
]

export default function DashboardPage() {
  const [tab, setTab] = useState<'personal' | 'company'>('personal')

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

      {/* Main Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlowCard className="md:col-span-1 flex flex-col items-center justify-center !py-8" hover={false}>
          <ScoreRing score={62} size={140} />
          <p className="text-lg font-bold mt-3">総合スコア</p>
          <p className="text-xs text-cyber-muted">前月比 <span className="text-cyber-green">+5</span></p>
        </GlowCard>

        <GlowCard className="md:col-span-2" hover={false}>
          <h3 className="text-sm font-semibold mb-4">分野別スコア</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categoryScores.map((cat) => (
              <div key={cat.label} className="text-center">
                <ScoreRing score={cat.score} size={70} strokeWidth={5} />
                <p className="text-xs text-cyber-muted mt-1">{cat.icon} {cat.label}</p>
              </div>
            ))}
          </div>
        </GlowCard>
      </div>

      {/* Score History Bar Chart */}
      <GlowCard hover={false}>
        <h3 className="text-sm font-semibold mb-4">スコア推移</h3>
        <div className="flex items-end gap-2 h-32">
          {[38, 42, 45, 48, 50, 53, 55, 57, 58, 60, 61, 62].map((s, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-cyber-glow/20 rounded-t border-t border-x border-cyber-glow/30 transition-all"
                style={{ height: `${(s / 100) * 100}%` }}
              />
              <span className="text-[9px] text-cyber-muted">{i + 1}月</span>
            </div>
          ))}
        </div>
      </GlowCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent Events */}
        <GlowCard hover={false}>
          <h3 className="text-sm font-semibold mb-3">最近のスコア変動</h3>
          <div className="space-y-2">
            {recentEvents.map((ev, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-cyber-bg/30">
                <span className={`text-xs font-mono font-bold ${ev.delta.startsWith('+') ? 'text-cyber-green' : 'text-cyber-red'}`}>
                  {ev.delta}
                </span>
                <span className="flex-1 text-sm">{ev.type}</span>
                <span className="text-[10px] text-cyber-muted">{ev.time}</span>
              </div>
            ))}
          </div>
        </GlowCard>

        {/* Improvement Priorities */}
        <GlowCard hover={false}>
          <h3 className="text-sm font-semibold mb-3">🎯 改善優先順位</h3>
          <div className="space-y-2">
            {improvements.map((item) => (
              <div key={item.priority} className="flex items-center gap-3 p-2.5 rounded-lg bg-cyber-bg/30 border border-cyber-border/20">
                <div className="w-6 h-6 rounded-full bg-cyber-glow/10 border border-cyber-glow/30 flex items-center justify-center text-xs text-cyber-glow font-bold">
                  {item.priority}
                </div>
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

      {/* AI Recommendation */}
      <GlowCard glowColor="cyan" hover={false} className="border-cyber-glow/20">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🤖</span>
          <div>
            <h3 className="text-sm font-semibold text-cyber-glow mb-1">AIからの次の一手</h3>
            <p className="text-sm text-cyber-text">
              現在の総合スコアは62です。特に弱いのはメール認証設定と教育/訓練です。
              まずは「自社診断テスト」のメール設定項目を完了し、
              その後に「AIクラウドセキュリティ」の基礎1-3を進めるのが最短です。
            </p>
          </div>
        </div>
      </GlowCard>
    </div>
  )
}
