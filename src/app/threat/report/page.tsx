'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { addScoreEvent, recalcUserScore, logActivity } from '@/lib/db'
import GlowCard from '@/components/common/GlowCard'
import CyberButton from '@/components/common/CyberButton'

const REPORT_URL = 'https://cybershield-jp.vercel.app/report'

const reportTypes = [
  { value: 'url', label: 'フィッシングURL', icon: '🔗', desc: '怪しいURLを通報' },
  { value: 'email', label: '詐欺メール', icon: '✉️', desc: '不審なメールを通報' },
  { value: 'sms', label: '危険SMS', icon: '📱', desc: '詐欺SMSを通報' },
  { value: 'domain', label: '偽サイト', icon: '🌐', desc: '偽サイトを通報' },
]

export default function ThreatReportPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [reportCount, setReportCount] = useState(0)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        // Get user's report count
        const { count } = await supabase
          .from('threat_reports_v2')
          .select('*', { count: 'exact', head: true })
          .eq('reporter_user_id', user.id)
        setReportCount(count || 0)
      }
    }
    init()
  }, [])

  const openReportPage = async () => {
    window.open(REPORT_URL, '_blank')

    if (userId) {
      await logActivity(userId, 'threat_report_opened', 'threat_report', { url: REPORT_URL })
    }
  }

  const recordReport = async (type: string) => {
    if (!userId) {
      window.open(REPORT_URL, '_blank')
      return
    }

    // Record in threat_reports_v2
    const { data, error } = await supabase
      .from('threat_reports_v2')
      .insert({
        reporter_user_id: userId,
        report_type: type,
        raw_content: `${type} report from CSJ app`,
        status: 'submitted',
      })
      .select()
      .single()

    if (!error && data) {
      // Add score +3 for reporting
      await addScoreEvent(userId, 3, `脅威通報（${type}）`, 'threat')
      await recalcUserScore(userId)
      await logActivity(userId, 'threat_reported', 'threat_report', { report_id: data.id, type })
      setReportCount(prev => prev + 1)
    }

    // Open external report page
    window.open(REPORT_URL, '_blank')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">🚨 脅威通報</h1>
        {userId && reportCount > 0 && (
          <span className="text-xs bg-cyber-glow/10 text-cyber-glow px-3 py-1 rounded-full">
            通報実績: {reportCount}件
          </span>
        )}
      </div>

      <GlowCard hover={false}>
        <p className="text-sm text-cyber-muted mb-4">
          フィッシングURL、詐欺メール、危険SMS、偽サイトを通報してください。
          通報はAIが一次判定し、脅威DBに蓄積されます。通報1件ごとに+3ptがスコアに加算されます。
        </p>

        <div className="grid grid-cols-2 gap-3">
          {reportTypes.map((rt) => (
            <button
              key={rt.value}
              onClick={() => recordReport(rt.value)}
              className="p-4 bg-cyber-bg/30 border border-cyber-border/30 rounded-xl hover:border-cyber-glow/30 hover:bg-cyber-glow/5 transition-all text-left"
            >
              <div className="text-2xl mb-2">{rt.icon}</div>
              <p className="text-sm font-medium">{rt.label}</p>
              <p className="text-xs text-cyber-muted mt-0.5">{rt.desc}</p>
              {userId && <p className="text-[10px] text-cyber-green mt-2">+3pt</p>}
            </button>
          ))}
        </div>
      </GlowCard>

      {/* Direct link to full report system */}
      <GlowCard hover={false} className="text-center !py-6">
        <p className="text-sm text-cyber-muted mb-3">詳細な通報フォーム（スクショ添付・メール転送対応）</p>
        <CyberButton size="lg" onClick={openReportPage}>
          📝 詳細通報フォームを開く（外部ページ）
        </CyberButton>
      </GlowCard>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <GlowCard hover={false} className="text-center">
          <p className="text-2xl font-bold text-cyber-glow">{reportCount}</p>
          <p className="text-xs text-cyber-muted">あなたの通報数</p>
        </GlowCard>
        <GlowCard hover={false} className="text-center">
          <p className="text-2xl font-bold text-cyber-glow">+{reportCount * 3}</p>
          <p className="text-xs text-cyber-muted">獲得ポイント</p>
        </GlowCard>
        <GlowCard hover={false} className="text-center">
          <p className="text-2xl font-bold text-cyber-glow">AI</p>
          <p className="text-xs text-cyber-muted">一次判定</p>
        </GlowCard>
      </div>

      {!userId && (
        <GlowCard hover={false} className="border-yellow-500/20">
          <p className="text-sm text-yellow-400">
            <a href="/login" className="underline">ログイン</a>すると通報がスコアに反映され、通報履歴も記録されます。
          </p>
        </GlowCard>
      )}
    </div>
  )
}
