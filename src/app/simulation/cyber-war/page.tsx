'use client'
import { useState } from 'react'
import GlowCard from '@/components/common/GlowCard'
import CyberButton from '@/components/common/CyberButton'

const scenarios = [
  { id: 'cw_japan', name: 'Japan Defense', difficulty: 1, desc: '日本のインフラを守るシナリオ', icon: '🇯🇵' },
  { id: 'cw_global', name: 'Global Warfare', difficulty: 2, desc: '多国間サイバー戦争シナリオ', icon: '🌍' },
  { id: 'cw_corp', name: 'Corporate Siege', difficulty: 3, desc: '企業への標的型攻撃対応', icon: '🏢' },
]

const events = [
  { turn: 1, type: 'attack', text: '東京電力のSCADAシステムに不正アクセスの兆候を検出', options: ['ネットワーク遮断', '監視強化', 'ハニーポット設置'] },
  { turn: 2, type: 'attack', text: '官公庁メールサーバーにフィッシング攻撃が集中', options: ['メールフィルタ強化', 'DMARC reject設定', '全職員に注意喚起'] },
  { turn: 3, type: 'attack', text: 'DNS水飲み場攻撃で複数企業サイトが改ざん', options: ['DNSSECを有効化', 'CDNに切替', 'サイト一時停止'] },
]

export default function CyberWarPage() {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'result'>('menu')
  const [currentTurn, setCurrentTurn] = useState(0)
  const [score, setScore] = useState(0)
  const [decisions, setDecisions] = useState<string[]>([])
  const [selectedScenario, setSelectedScenario] = useState<string>('')

  const handleDecision = (option: string) => {
    const points = option.includes('設定') || option.includes('有効化') ? 15 : option.includes('強化') ? 12 : 8
    setScore(prev => prev + points)
    setDecisions(prev => [...prev, option])
    if (currentTurn < events.length - 1) {
      setCurrentTurn(prev => prev + 1)
    } else {
      setGameState('result')
    }
  }

  if (gameState === 'result') {
    const maxScore = events.length * 15
    const percent = Math.round((score / maxScore) * 100)
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-xl font-bold">⚔️ 戦闘結果</h1>
        <GlowCard hover={false} className="text-center !py-8">
          <div className="text-5xl mb-4">{percent >= 80 ? '🏆' : percent >= 60 ? '⭐' : '💪'}</div>
          <p className="text-2xl font-bold text-cyber-glow">{score}ポイント</p>
          <p className="text-sm text-cyber-muted mt-2">
            {percent >= 80 ? '素晴らしい防衛戦略です！' : percent >= 60 ? '良い判断でした。改善の余地もあります。' : '防衛スキルを磨きましょう。'}
          </p>
        </GlowCard>
        <GlowCard hover={false}>
          <h3 className="text-sm font-semibold mb-3">判断ログ</h3>
          {events.map((ev, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 border-b border-cyber-border/20 last:border-0">
              <span className="text-xs text-cyber-muted">Turn {ev.turn}</span>
              <span className="flex-1 text-sm">{decisions[i]}</span>
            </div>
          ))}
        </GlowCard>
        <CyberButton onClick={() => { setGameState('menu'); setCurrentTurn(0); setScore(0); setDecisions([]) }}>
          メニューに戻る
        </CyberButton>
      </div>
    )
  }

  if (gameState === 'playing') {
    const ev = events[currentTurn]
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">⚔️ Cyber戦争 — Turn {ev.turn}</h1>
          <span className="text-sm text-cyber-glow font-mono">スコア: {score}</span>
        </div>
        <div className="w-full h-1.5 bg-cyber-bg rounded-full">
          <div className="h-full bg-cyber-red rounded-full transition-all" style={{ width: `${((currentTurn + 1) / events.length) * 100}%` }} />
        </div>
        <GlowCard hover={false} className="border-cyber-red/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs px-2 py-0.5 bg-cyber-red/10 text-cyber-red rounded">🚨 攻撃検出</span>
          </div>
          <p className="text-base font-semibold mb-6">{ev.text}</p>
          <p className="text-xs text-cyber-muted mb-3">対応を選択してください：</p>
          <div className="space-y-3">
            {ev.options.map((opt) => (
              <button
                key={opt}
                onClick={() => handleDecision(opt)}
                className="w-full text-left p-4 rounded-lg bg-cyber-bg/30 border border-cyber-border/30 hover:border-cyber-glow/30 hover:bg-cyber-glow/5 transition-all text-sm"
              >
                {opt}
              </button>
            ))}
          </div>
        </GlowCard>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-xl font-bold">⚔️ Cyber戦争シミュレーション</h1>
      <p className="text-sm text-cyber-muted">サイバー攻撃に対する防衛判断を学ぶ戦略シミュレーションゲーム</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarios.map((s) => (
          <GlowCard key={s.id} glowColor="red" onClick={() => { setSelectedScenario(s.id); setGameState('playing') }}>
            <div className="text-center">
              <div className="text-3xl mb-3">{s.icon}</div>
              <p className="font-semibold text-sm">{s.name}</p>
              <p className="text-xs text-cyber-muted mt-1">{s.desc}</p>
              <div className="flex justify-center gap-1 mt-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${i < s.difficulty ? 'bg-cyber-red' : 'bg-cyber-border/30'}`} />
                ))}
              </div>
            </div>
          </GlowCard>
        ))}
      </div>

      <GlowCard hover={false}>
        <h3 className="text-sm font-semibold mb-3">🏆 ランキング</h3>
        <div className="space-y-2 text-sm">
          {['CyberShield_Pro — 450pt', 'SecOps_Master — 380pt', 'DefenseFirst — 320pt'].map((r, i) => (
            <div key={i} className="flex items-center gap-3 p-2 bg-cyber-bg/30 rounded">
              <span className="text-cyber-glow font-bold">{i + 1}</span>
              <span>{r}</span>
            </div>
          ))}
        </div>
      </GlowCard>
    </div>
  )
}
