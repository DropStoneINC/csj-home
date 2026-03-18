'use client'
import { useState } from 'react'
import GlowCard from '@/components/common/GlowCard'
import CyberButton from '@/components/common/CyberButton'

const sampleResults = [
  { id: '1', type: 'url', value: 'http://amaz0n-login.suspicious.com', category: 'phishing', severity: 'critical', confidence: 0.95, reports: 127, firstSeen: '2026-02-15', summary: 'Amazonを模倣したフィッシングサイト。ログイン情報の窃取が目的。' },
  { id: '2', type: 'domain', value: 'rakuten-verify.xyz', category: 'phishing', severity: 'high', confidence: 0.88, reports: 43, firstSeen: '2026-03-01', summary: '楽天を騙るドメイン。SMS経由でのリンク誘導が報告されている。' },
  { id: '3', type: 'email', value: 'support@micr0soft-alert.com', category: 'scam', severity: 'high', confidence: 0.91, reports: 89, firstSeen: '2026-01-20', summary: 'Microsoftサポートを装った詐欺メール。偽のセキュリティ警告でアカウント情報を詐取。' },
  { id: '4', type: 'ip', value: '185.234.219.47', category: 'malware', severity: 'critical', confidence: 0.97, reports: 312, firstSeen: '2025-11-10', summary: 'マルウェアC2サーバー。複数のボットネットとの通信が確認されている。' },
]

const severityColors: Record<string, string> = {
  critical: 'text-cyber-red bg-cyber-red/10',
  high: 'text-orange-400 bg-orange-400/10',
  medium: 'text-yellow-400 bg-yellow-400/10',
  low: 'text-cyber-green bg-cyber-green/10',
}

const categoryLabels: Record<string, string> = {
  phishing: 'フィッシング',
  malware: 'マルウェア',
  scam: '詐欺',
  spoofing: 'なりすまし',
  credential_theft: '認証情報窃取',
}

export default function ThreatSearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<typeof sampleResults | null>(null)
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<typeof sampleResults[0] | null>(null)

  const handleSearch = () => {
    setSearching(true)
    setSelected(null)
    setTimeout(() => {
      setResults(sampleResults.filter(r =>
        r.value.toLowerCase().includes(query.toLowerCase()) ||
        r.category.includes(query.toLowerCase()) ||
        query === ''
      ))
      setSearching(false)
    }, 1000)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-xl font-bold">🔎 脅威検索データベース</h1>
      <p className="text-sm text-cyber-muted">URL、ドメイン、IPアドレス、メールアドレスなどを検索できます。</p>

      <GlowCard hover={false} className="!p-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="URL / ドメイン / IP / メール / キーワード で検索..."
            className="flex-1 bg-cyber-bg/50 border border-cyber-border/50 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-cyber-glow/50"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <CyberButton onClick={handleSearch} disabled={searching}>
            {searching ? '検索中...' : '検索'}
          </CyberButton>
        </div>
        <div className="flex gap-2 mt-3">
          {['phishing', 'malware', 'scam'].map(tag => (
            <button
              key={tag}
              onClick={() => { setQuery(tag); handleSearch() }}
              className="text-[10px] px-2 py-1 rounded bg-cyber-bg/50 text-cyber-muted hover:text-cyber-glow border border-cyber-border/30 hover:border-cyber-glow/30 transition-all"
            >
              {categoryLabels[tag] || tag}
            </button>
          ))}
        </div>
      </GlowCard>

      {results && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <p className="text-xs text-cyber-muted">{results.length}件の結果</p>
            {results.map((r) => (
              <GlowCard
                key={r.id}
                glowColor={r.severity === 'critical' ? 'red' : 'cyan'}
                onClick={() => setSelected(r)}
                className={`!p-4 ${selected?.id === r.id ? 'border-cyber-glow/40' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs text-cyber-muted uppercase">{r.type}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${severityColors[r.severity]}`}>
                    {r.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm font-mono mb-1 break-all">{r.value}</p>
                <div className="flex items-center gap-3 text-[10px] text-cyber-muted">
                  <span>{categoryLabels[r.category]}</span>
                  <span>通報 {r.reports}件</span>
                  <span>信頼度 {Math.round(r.confidence * 100)}%</span>
                </div>
              </GlowCard>
            ))}
          </div>

          {selected && (
            <div className="space-y-3">
              <GlowCard hover={false}>
                <h3 className="text-sm font-semibold mb-3">脅威詳細</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between p-2 bg-cyber-bg/30 rounded">
                    <span className="text-cyber-muted">種別</span>
                    <span>{selected.type.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-cyber-bg/30 rounded">
                    <span className="text-cyber-muted">カテゴリ</span>
                    <span>{categoryLabels[selected.category]}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-cyber-bg/30 rounded">
                    <span className="text-cyber-muted">危険度</span>
                    <span className={severityColors[selected.severity]}>{selected.severity.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-cyber-bg/30 rounded">
                    <span className="text-cyber-muted">通報数</span>
                    <span>{selected.reports}件</span>
                  </div>
                  <div className="flex justify-between p-2 bg-cyber-bg/30 rounded">
                    <span className="text-cyber-muted">初回検出</span>
                    <span>{selected.firstSeen}</span>
                  </div>
                </div>
              </GlowCard>

              <GlowCard glowColor="cyan" hover={false}>
                <h3 className="text-sm font-semibold text-cyber-glow mb-2">🤖 AI要約</h3>
                <p className="text-sm">{selected.summary}</p>
              </GlowCard>

              <GlowCard hover={false}>
                <h3 className="text-sm font-semibold mb-2">対処法</h3>
                <ul className="text-sm space-y-1.5 text-cyber-muted">
                  <li>• このURLやドメインにアクセスしないでください</li>
                  <li>• すでにアクセスした場合はパスワードを変更してください</li>
                  <li>• 不審なメールは転送せず、通報機能から報告してください</li>
                  <li>• 社内に周知し、類似の被害を防止してください</li>
                </ul>
              </GlowCard>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
