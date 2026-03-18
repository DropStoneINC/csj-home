'use client'
import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import GlowCard from '@/components/common/GlowCard'

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  timestamp: Date
}

const suggestedQuestions = [
  '何から始めればいい？',
  'うちの会社のセキュリティの弱点は？',
  'SPF/DKIM/DMARCって何？',
  'パスワード管理のベストプラクティスは？',
  'フィッシングメールの見分け方は？',
  'クラウド権限管理の改善方法は？',
]

const aiResponses: Record<string, string> = {
  'default': 'ご質問ありがとうございます。現在のセキュリティスコアを確認して、最適な回答をお伝えします。具体的に知りたいことがあれば、お気軽にお聞きください。',
  '何から始めればいい': '現在の総合スコアは62点です。まず以下の3つから始めることを推奨します：\n\n1️⃣ **自己診断テスト**を受ける（/assessment/self）→ 現在地を把握\n2️⃣ **パスワードマネージャー**を導入する → 認証スコア+10見込み\n3️⃣ **SPF/DKIM/DMARC**を設定する → メールスコア+15見込み\n\nまずは自己診断テストから始めましょう！',
  '弱点': 'あなたの組織のスコア分析結果です：\n\n🔴 **メール防御: 45点** ← 最も改善が必要\n - DMARCが未設定\n - DKIMの一部セレクターが未設定\n\n🟡 **教育/訓練: 35点**\n - 定期的なセキュリティ教育が未実施\n\n🟢 **通報/検知: 80点** ← 良好\n\n最優先は**メール設定**の改善です。',
  'spf': 'SPF/DKIM/DMARCは、メールなりすまし防止の3大技術です：\n\n📧 **SPF** = 正規の送信サーバーを宣言する仕組み\n🔑 **DKIM** = メールに電子署名を付与する仕組み\n🛡️ **DMARC** = SPFとDKIMの結果に基づくポリシー\n\nこの3つを正しく設定すると、なりすましメールを大幅に削減できます。\n\n設定状況は「メール/クラウド簡易診断」（/assessment/email-cloud）で確認できます。',
  'パスワード': 'パスワード管理のベストプラクティス：\n\n1️⃣ **パスワードマネージャー**を使う（1Password, Bitwarden等）\n2️⃣ サイトごとに**固有のパスワード**を設定\n3️⃣ **12文字以上**で英数記号を組み合わせる\n4️⃣ 重要なサービスには必ず**MFA（多要素認証）**を設定\n5️⃣ パスワードを**メモやメールで共有しない**\n\n特にMFAの設定が最も効果的です。これだけでアカウント乗っ取りリスクが99%以上削減されます。',
  'フィッシング': 'フィッシングメールの見分け方：\n\n🚩 **送信元アドレス**が微妙に違う（例: support@amaz0n.co）\n🚩 **緊急性を煽る**文面（「24時間以内にアカウントが停止」）\n🚩 **個人情報の入力を求める**リンクがある\n🚩 **宛名が一般的**（「お客様各位」等、名前がない）\n🚩 **文法やフォント**に違和感がある\n\n不審に感じたら、脅威通報（/threat/report）から報告してください。AIが自動判定します！',
  'クラウド': 'クラウド権限管理の改善ステップ：\n\n1️⃣ **最小権限の原則**を適用（必要な権限だけ付与）\n2️⃣ **定期的な権限棚卸し**を実施（四半期ごとを推奨）\n3️⃣ **退職者アカウント**の即時無効化フローを構築\n4️⃣ **管理者アカウント**の共有禁止\n5️⃣ **アクセスログ**の定期監査\n\nまずは「AIクラウドセキュリティ」コース（/learn/cloud-security）で基礎を学ぶのが効果的です。',
}

export default function AgentPage() {
  const searchParams = useSearchParams()
  const initialQ = searchParams.get('q') || ''
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState(initialQ)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEnd = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (initialQ) {
      handleSend(initialQ)
    }
  }, [])

  const getAIResponse = (text: string): string => {
    const lower = text.toLowerCase()
    if (lower.includes('始め') || lower.includes('最初')) return aiResponses['何から始めればいい']
    if (lower.includes('弱点') || lower.includes('問題') || lower.includes('弱い')) return aiResponses['弱点']
    if (lower.includes('spf') || lower.includes('dkim') || lower.includes('dmarc')) return aiResponses['spf']
    if (lower.includes('パスワード')) return aiResponses['パスワード']
    if (lower.includes('フィッシング')) return aiResponses['フィッシング']
    if (lower.includes('クラウド') || lower.includes('権限')) return aiResponses['クラウド']
    return aiResponses['default']
  }

  const handleSend = (text?: string) => {
    const msg = text || input
    if (!msg.trim()) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: msg,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: getAIResponse(msg),
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, aiMsg])
      setIsTyping(false)
    }, 1500)
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-100px)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-cyber-glow/10 border border-cyber-glow/30 flex items-center justify-center text-xl">
          🤖
        </div>
        <div>
          <h1 className="text-lg font-bold">Cyber Shield AIエージェント</h1>
          <p className="text-xs text-cyber-muted">あなたのセキュリティコーチ・ナビゲーター・アナリスト</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🛡️</div>
            <p className="text-sm text-cyber-muted mb-6">何でも聞いてください。あなたのセキュリティ状況に合わせて回答します。</p>
            <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="text-left text-xs p-3 rounded-lg bg-cyber-card border border-cyber-border/30 hover:border-cyber-glow/30 transition-all text-cyber-muted hover:text-cyber-text"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
              msg.role === 'user'
                ? 'bg-cyber-glow/10 border border-cyber-glow/20 text-cyber-text'
                : 'bg-cyber-card border border-cyber-border/30'
            }`}>
              <div className="whitespace-pre-wrap">{msg.text}</div>
              <p className="text-[10px] text-cyber-muted mt-2">
                {msg.timestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-cyber-card border border-cyber-border/30 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-cyber-glow rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-cyber-glow rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-cyber-glow rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEnd} />
      </div>

      {/* Input */}
      <div className="flex gap-3 pb-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="質問を入力..."
          className="flex-1 bg-cyber-card border border-cyber-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyber-glow/50"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim()}
          className="px-5 py-3 bg-cyber-glow/10 text-cyber-glow border border-cyber-glow/30 rounded-xl text-sm font-medium hover:bg-cyber-glow/20 transition-all disabled:opacity-40"
        >
          送信
        </button>
      </div>
    </div>
  )
}
