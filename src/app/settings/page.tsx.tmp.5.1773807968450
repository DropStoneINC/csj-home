'use client'
import { useState } from 'react'
import GlowCard from '@/components/common/GlowCard'
import CyberButton from '@/components/common/CyberButton'

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState('TOMO')
  const [email] = useState('nakagawa.tomohiro@dropstone.co.jp')
  const [persona, setPersona] = useState('manager')
  const [language, setLanguage] = useState('ja')
  const [orgName, setOrgName] = useState('DropStone Inc.')
  const [orgIndustry, setOrgIndustry] = useState('IT')
  const [orgSize, setOrgSize] = useState('10-50')
  const [aiEnabled, setAiEnabled] = useState(true)
  const [notifications, setNotifications] = useState(true)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold">⚙️ 設定</h1>

      {/* Profile */}
      <GlowCard hover={false}>
        <h3 className="text-sm font-semibold mb-4">プロフィール</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-cyber-muted mb-1.5">表示名</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-cyber-bg/50 border border-cyber-border/50 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-cyber-glow/50"
            />
          </div>
          <div>
            <label className="block text-xs text-cyber-muted mb-1.5">メールアドレス</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full bg-cyber-bg/30 border border-cyber-border/30 rounded-lg px-4 py-2.5 text-sm text-cyber-muted"
            />
          </div>
          <div>
            <label className="block text-xs text-cyber-muted mb-1.5">ペルソナタイプ</label>
            <select
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              className="w-full bg-cyber-bg/50 border border-cyber-border/50 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-cyber-glow/50"
            >
              <option value="individual">個人</option>
              <option value="employee">社員</option>
              <option value="manager">管理者</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-cyber-muted mb-1.5">言語</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-cyber-bg/50 border border-cyber-border/50 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-cyber-glow/50"
            >
              <option value="ja">日本語</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </GlowCard>

      {/* Organization */}
      <GlowCard hover={false}>
        <h3 className="text-sm font-semibold mb-4">所属企業</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-cyber-muted mb-1.5">企業名</label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full bg-cyber-bg/50 border border-cyber-border/50 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-cyber-glow/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-cyber-muted mb-1.5">業種</label>
              <select
                value={orgIndustry}
                onChange={(e) => setOrgIndustry(e.target.value)}
                className="w-full bg-cyber-bg/50 border border-cyber-border/50 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-cyber-glow/50"
              >
                <option value="IT">IT・通信</option>
                <option value="finance">金融</option>
                <option value="manufacturing">製造</option>
                <option value="retail">小売</option>
                <option value="healthcare">医療</option>
                <option value="education">教育</option>
                <option value="government">行政</option>
                <option value="other">その他</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-cyber-muted mb-1.5">従業員数</label>
              <select
                value={orgSize}
                onChange={(e) => setOrgSize(e.target.value)}
                className="w-full bg-cyber-bg/50 border border-cyber-border/50 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-cyber-glow/50"
              >
                <option value="1-9">1〜9人</option>
                <option value="10-50">10〜50人</option>
                <option value="51-300">51〜300人</option>
                <option value="301-1000">301〜1000人</option>
                <option value="1001+">1001人以上</option>
              </select>
            </div>
          </div>
        </div>
      </GlowCard>

      {/* AI & Notifications */}
      <GlowCard hover={false}>
        <h3 className="text-sm font-semibold mb-4">アプリ設定</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">AIエージェント</p>
              <p className="text-xs text-cyber-muted">AIからの改善提案を受け取る</p>
            </div>
            <button
              onClick={() => setAiEnabled(!aiEnabled)}
              className={`w-12 h-6 rounded-full transition-all ${aiEnabled ? 'bg-cyber-glow/30' : 'bg-cyber-border/30'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-all ${aiEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">通知</p>
              <p className="text-xs text-cyber-muted">脅威アラートやタスク通知</p>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`w-12 h-6 rounded-full transition-all ${notifications ? 'bg-cyber-glow/30' : 'bg-cyber-border/30'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-all ${notifications ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>
      </GlowCard>

      <div className="flex gap-3">
        <CyberButton>保存する</CyberButton>
        <CyberButton variant="danger" onClick={() => {}}>ログアウト</CyberButton>
      </div>
    </div>
  )
}
