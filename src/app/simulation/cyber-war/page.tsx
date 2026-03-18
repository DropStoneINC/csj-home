'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { addScoreEvent, recalcUserScore, logActivity } from '@/lib/db'
import GlowCard from '@/components/common/GlowCard'
import CyberButton from '@/components/common/CyberButton'

const GAME_URL = 'https://global-warfare.vercel.app/'

export default function CyberWarPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [scored, setScored] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
    }
    init()
  }, [])

  const startGame = async () => {
    setPlaying(true)

    // Open game in new tab
    window.open(GAME_URL, '_blank')

    if (userId) {
      const { data } = await supabase
        .from('simulation_sessions')
        .insert({
          user_id: userId,
          simulation_type: 'cyber_war',
          scenario_code: 'global_warfare',
          difficulty_level: 1,
          status: 'started',
        })
        .select()
        .single()

      if (data) setSessionId(data.id)
      await logActivity(userId, 'simulation_started', 'cyber_war', { game: 'global_warfare' })
    }
  }

  const completeGame = async () => {
    if (userId && !scored) {
      if (sessionId) {
        await supabase
          .from('simulation_sessions')
          .update({
            status: 'completed',
            score: 100,
            completed_at: new Date().toISOString(),
            learned_topics_json: ['cyber_strategy', 'national_defense', 'resource_management'],
          })
          .eq('id', sessionId)
      }

      await addScoreEvent(userId, 5, 'Cyber戦争ゲームプレイ完了', 'simulation')
      await recalcUserScore(userId)
      await logActivity(userId, 'simulation_completed', 'cyber_war', { session_id: sessionId })
      setScored(true)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-xl font-bold">⚔️ Cyber戦争シミュレーション</h1>

      {/* Hero */}
      <GlowCard hover={false} className="text-center !py-8">
        <div className="text-6xl mb-4">🌐</div>
        <h2 className="text-2xl font-bold text-cyber-glow mb-2">CYBER SHIELD JAPAN</h2>
        <p className="text-lg text-cyber-muted mb-1">: : GLOBAL WARFARE : :</p>
        <p className="text-sm text-cyber-muted mt-4 max-w-lg mx-auto">
          2030年—第三次世界大戦が勃発した。サイバー空間が主戦場となった世界で、
          国家の指導者として100年間の戦略を決断せよ。
        </p>
        <p className="text-xs text-cyber-muted mt-2">
          先制攻撃、ドローン戦、情報戦—生き残れるのは、あなたの判断次第。
        </p>

        <div className="mt-6 flex flex-col items-center gap-3">
          {!playing ? (
            <CyberButton size="lg" onClick={startGame}>
              🎮 ゲームを開始する（新しいタブ）
            </CyberButton>
          ) : !scored ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-cyber-glow animate-pulse">
                <span className="w-2 h-2 bg-cyber-glow rounded-full" />
                ゲームプレイ中...
              </div>
              <div className="flex gap-3">
                <CyberButton onClick={() => window.open(GAME_URL, '_blank')} variant="secondary">
                  ゲーム画面を再度開く
                </CyberButton>
                <CyberButton onClick={completeGame}>
                  ✓ プレイ完了（+5pt）
                </CyberButton>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="px-4 py-2 bg-cyber-green/10 border border-cyber-green/30 rounded-lg text-cyber-green text-sm font-medium">
                ✓ +5pt 獲得！ダッシュボードに反映されました
              </div>
              <div className="flex gap-3">
                <CyberButton variant="secondary" onClick={() => { setPlaying(false); setScored(false); setSessionId(null) }}>
                  もう一度プレイ
                </CyberButton>
                <CyberButton onClick={() => window.location.href = '/dashboard'}>
                  ダッシュボードへ
                </CyberButton>
              </div>
            </div>
          )}

          {!playing && userId && (
            <p className="text-xs text-cyber-green">ログイン済み — プレイ結果がスコアに反映されます（+5pt）</p>
          )}
          {!playing && !userId && (
            <p className="text-xs text-yellow-400">ログインするとプレイ結果がスコアに反映されます</p>
          )}
        </div>
      </GlowCard>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlowCard hover={false}>
          <h3 className="text-sm font-semibold mb-2">🎯 学べること</h3>
          <ul className="text-xs text-cyber-muted space-y-1">
            <li>• サイバー攻撃と防御の戦略的判断</li>
            <li>• 国家レベルのセキュリティ資源管理</li>
            <li>• 先制攻撃 vs 防御のトレードオフ</li>
          </ul>
        </GlowCard>
        <GlowCard hover={false}>
          <h3 className="text-sm font-semibold mb-2">🏆 スコア連携</h3>
          <ul className="text-xs text-cyber-muted space-y-1">
            <li>• ゲームプレイ完了: +5pt</li>
            <li>• プレイ履歴がダッシュボードに表示</li>
            <li>• 学習トピックが自動記録</li>
          </ul>
        </GlowCard>
        <GlowCard hover={false}>
          <h3 className="text-sm font-semibold mb-2">🌍 選択可能な国家</h3>
          <ul className="text-xs text-cyber-muted space-y-1">
            <li>• 🇺🇸 USA — AI・サイバー技術が強い</li>
            <li>• 🇨🇳 China — ドローン量産能力</li>
            <li>• 🇷🇺 Russia — 攻撃能力</li>
            <li>• 🇯🇵 Japan — 防御技術</li>
            <li>• 🇪🇺 EU — 経済力</li>
          </ul>
        </GlowCard>
      </div>
    </div>
  )
}
