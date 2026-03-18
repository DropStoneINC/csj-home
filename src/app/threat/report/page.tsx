'use client'
import { useState } from 'react'
import GlowCard from '@/components/common/GlowCard'
import CyberButton from '@/components/common/CyberButton'

const reportTypes = [
  { value: 'url', label: '不審なURL', icon: '🔗' },
  { value: 'email', label: 'フィッシングメール', icon: '✉️' },
  { value: 'sms', label: '詐欺SMS', icon: '💬' },
  { value: 'domain', label: '偽サイト', icon: '🌐' },
  { value: 'file', label: '不審な添付ファイル', icon: '📎' },
  { value: 'screenshot', label: 'スクリーンショット', icon: '📸' },
]

export default function ThreatReportPage() {
  const [step, setStep] = useState<'type' | 'detail' | 'analysis' | 'done'>('type')
  const [reportType, setReportType] = useState('')
  const [targetValue, setTargetValue] = useState('')
  const [description, setDescription] = useState('')
  const [analyzing, setAnalyzing] = useState(false)

  const handleSubmit = () => {
    setStep('analysis')
    setAnalyzing(true)
    setTimeout(() => {
      setAnalyzing(false)
      setStep('done')
    }, 3000)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold">🚨 脅威通報</h1>
      <p className="text-sm text-cyber-muted">不審なURL、メール、SMSなどを通報してください。AIが自動判定します。</p>

      {/* Progress */}
      <div className="flex gap-2">
        {['type', 'detail', 'analysis', 'done'].map((s, i) => (
          <div key={s} className={`flex-1 h-1 rounded-full ${
            ['type', 'detail', 'analysis', 'done'].indexOf(step) >= i ? 'bg-cyber-red' : 'bg-cyber-border/30'
          }`} />
        ))}
      </div>

      {step === 'type' && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {reportTypes.map((rt) => (
            <GlowCard
              key={rt.value}
              glowColor="red"
              onClick={() => { setReportType(rt.value); setStep('detail') }}
              className="text-center !p-4"
            >
              <div className="text-2xl mb-2">{rt.icon}</div>
              <p className="text-xs font-medium">{rt.label}</p>
            </GlowCard>
          ))}
        </div>
      )}

      {step === 'detail' && (
        <GlowCard hover={false}>
          <h3 className="text-sm font-semibold mb-4">
            {reportTypes.find(r => r.value === reportType)?.icon}{' '}
            {reportTypes.find(r => r.value === reportType)?.label}の詳細
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-cyber-muted mb-1.5">
                {reportType === 'email' ? 'メール送信元アドレス' :
                 reportType === 'sms' ? 'SMS送信元番号' :
                 reportType === 'url' || reportType === 'domain' ? 'URLまたはドメイン' : '対象の情報'}
              </label>
              <input
                type="text"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder={reportType === 'url' ? 'https://suspicious-site.example.com' : reportType === 'email' ? 'suspicious@example.com' : ''}
                className="w-full bg-cyber-bg/50 border border-cyber-border/50 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-cyber-red/50"
              />
            </div>
            <div>
              <label className="block text-xs text-cyber-muted mb-1.5">詳細説明（任意）</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="どのような経緯で受信したか、不審に思った理由など"
                className="w-full bg-cyber-bg/50 border border-cyber-border/50 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-cyber-red/50 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <CyberButton variant="ghost" onClick={() => setStep('type')}>← 戻る</CyberButton>
              <CyberButton variant="danger" onClick={handleSubmit} disabled={!targetValue}>
                🚨 通報する
              </CyberButton>
            </div>
          </div>
        </GlowCard>
      )}

      {step === 'analysis' && analyzing && (
        <GlowCard hover={false} className="text-center !py-10">
          <div className="w-16 h-16 mx-auto border-2 border-cyber-red/30 border-t-cyber-red rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium">AIが脅威を分析しています...</p>
          <div className="mt-4 space-y-2 text-xs text-cyber-muted">
            <p>✓ URLパターンを解析中</p>
            <p>✓ 既知の脅威DBと照合中</p>
            <p className="animate-pulse">⟳ リスクスコアを算出中</p>
          </div>
        </GlowCard>
      )}

      {step === 'done' && (
        <>
          <GlowCard hover={false} className="border-cyber-red/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">AI分析結果</h3>
              <span className="px-3 py-1 bg-cyber-red/10 text-cyber-red text-xs rounded-full font-medium">
                リスク: 高
              </span>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-cyber-bg/30 rounded-lg">
                <p className="text-xs text-cyber-muted">分類</p>
                <p className="text-sm font-medium text-cyber-red">フィッシング（高確率）</p>
              </div>
              <div className="p-3 bg-cyber-bg/30 rounded-lg">
                <p className="text-xs text-cyber-muted">対象</p>
                <p className="text-sm font-mono">{targetValue}</p>
              </div>
              <div className="p-3 bg-cyber-bg/30 rounded-lg">
                <p className="text-xs text-cyber-muted">AI判定</p>
                <p className="text-sm">
                  このURLは既知のフィッシングパターンに類似しています。
                  正規サイトのドメインを模倣した偽サイトの可能性が高いです。
                  リンクをクリックせず、個人情報を入力しないでください。
                </p>
              </div>
            </div>
          </GlowCard>

          <GlowCard glowColor="green" hover={false}>
            <p className="text-sm text-cyber-green">✓ 通報が完了しました。スコア +3 が付与されました。</p>
            <p className="text-xs text-cyber-muted mt-1">この情報は脅威DBに登録され、他のユーザーの保護に貢献します。</p>
          </GlowCard>

          <div className="flex gap-3">
            <CyberButton onClick={() => { setStep('type'); setTargetValue(''); setDescription('') }}>
              別の脅威を通報
            </CyberButton>
            <CyberButton variant="secondary" onClick={() => window.location.href = '/threat/search'}>
              脅威DBを検索
            </CyberButton>
          </div>
        </>
      )}
    </div>
  )
}
