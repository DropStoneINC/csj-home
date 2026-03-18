'use client'
import { useState } from 'react'
import GlowCard from '@/components/common/GlowCard'
import CyberButton from '@/components/common/CyberButton'

export default function EmailCloudAssessmentPage() {
  const [domain, setDomain] = useState('')
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleScan = () => {
    setScanning(true)
    // Simulate scan
    setTimeout(() => {
      setResult({
        domain,
        spf: { status: 'pass', record: 'v=spf1 include:_spf.google.com ~all' },
        dkim: { status: 'warning', detail: 'DKIM署名は検出されましたが、一部のセレクターが未設定です' },
        dmarc: { status: 'fail', detail: 'DMARCレコードが見つかりません' },
        ssl: { status: 'pass', detail: 'TLS 1.3 対応済み', expiry: '2026-08-15' },
        cloudScore: 55,
        emailScore: 45,
      })
      setScanning(false)
    }, 2000)
  }

  const StatusBadge = ({ status }: { status: string }) => (
    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
      status === 'pass' ? 'bg-cyber-green/10 text-cyber-green' :
      status === 'warning' ? 'bg-yellow-500/10 text-yellow-400' :
      'bg-cyber-red/10 text-cyber-red'
    }`}>
      {status === 'pass' ? '✓ PASS' : status === 'warning' ? '⚠ WARNING' : '✗ FAIL'}
    </span>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold">✉️ メール・クラウド簡易診断</h1>
      <p className="text-sm text-cyber-muted">ドメインを入力すると、メール設定（SPF/DKIM/DMARC）とSSL/TLS設定を簡易診断します。</p>

      <GlowCard hover={false}>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="example.co.jp"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="flex-1 bg-cyber-bg/50 border border-cyber-border/50 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-cyber-glow/50"
          />
          <CyberButton onClick={handleScan} disabled={!domain || scanning}>
            {scanning ? '診断中...' : '診断開始'}
          </CyberButton>
        </div>
      </GlowCard>

      {scanning && (
        <GlowCard hover={false} className="text-center !py-8">
          <div className="w-12 h-12 mx-auto border-2 border-cyber-glow/30 border-t-cyber-glow rounded-full animate-spin mb-4" />
          <p className="text-sm">ドメインをスキャンしています...</p>
          <p className="text-xs text-cyber-muted mt-1">SPF / DKIM / DMARC / SSL/TLS を確認中</p>
        </GlowCard>
      )}

      {result && !scanning && (
        <>
          <GlowCard hover={false}>
            <h3 className="text-sm font-semibold mb-4">📧 メール設定診断結果: {result.domain}</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-cyber-bg/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium">SPF レコード</p>
                  <p className="text-xs text-cyber-muted mt-0.5">{result.spf.record}</p>
                </div>
                <StatusBadge status={result.spf.status} />
              </div>
              <div className="flex items-center justify-between p-3 bg-cyber-bg/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium">DKIM 署名</p>
                  <p className="text-xs text-cyber-muted mt-0.5">{result.dkim.detail}</p>
                </div>
                <StatusBadge status={result.dkim.status} />
              </div>
              <div className="flex items-center justify-between p-3 bg-cyber-bg/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium">DMARC ポリシー</p>
                  <p className="text-xs text-cyber-muted mt-0.5">{result.dmarc.detail}</p>
                </div>
                <StatusBadge status={result.dmarc.status} />
              </div>
              <div className="flex items-center justify-between p-3 bg-cyber-bg/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium">SSL/TLS</p>
                  <p className="text-xs text-cyber-muted mt-0.5">{result.ssl.detail} (有効期限: {result.ssl.expiry})</p>
                </div>
                <StatusBadge status={result.ssl.status} />
              </div>
            </div>
          </GlowCard>

          <GlowCard glowColor="cyan" hover={false} className="border-cyber-glow/20">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🤖</span>
              <div>
                <h3 className="text-sm font-semibold text-cyber-glow mb-1">AI改善提案</h3>
                <p className="text-sm">
                  DMARCレコードが未設定です。なりすましメール防止のために、
                  まず「v=DMARC1; p=none; rua=mailto:dmarc@{result.domain}」を設定し、
                  レポートを確認してからポリシーを強化することを推奨します。
                  これだけでメールスコアが+15向上します。
                </p>
              </div>
            </div>
          </GlowCard>
        </>
      )}
    </div>
  )
}
