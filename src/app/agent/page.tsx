'use client'
import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getUserScore, getScoreEvents } from '@/lib/db'

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

function AgentContent() {
  const searchParams = useSearchParams()
  const initialQ = searchParams.get('q') || ''
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState(initialQ)
  const [isTyping, setIsTyping] = useState(false)
  const [userContext, setUserContext] = useState<any>(null)
  const messagesEnd = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load user context for AI
  useEffect(() => {
    const loadContext = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single()

      const score = await getUserScore(user.id)
      const events = await getScoreEvents(user.id, 5)

      setUserContext({
        displayName: profile?.display_name || '',
        score: score?.overall_score || 0,
        recentEvents: events,
      })
    }
    loadContext()
  }, [])

  useEffect(() => {
    if (initialQ) {
      handleSend(initialQ)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQ])

  const handleSend = async (text?: string) => {
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

    try {
      const allMessages = [...messages, userMsg].map(m => ({ role: m.role, text: m.text }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages,
          userContext,
        }),
      })

      const data = await res.json()
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: data.reply || data.error || 'エラーが発生しました。',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, aiMsg])
    } catch (err) {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: 'ネットワークエラーが発生しました。しばらく待ってからもう一度お試しください。',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errMsg])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-100px)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-cyber-glow/10 border border-cyber-glow/30 flex items-center justify-center text-xl">
          🤖
        </div>
        <div>
          <h1 className="text-lg font-bold">Cyber Shield AIエージェント</h1>
          <p className="text-xs text-cyber-muted">
            {userContext ? `${userContext.displayName || 'ユーザー'}さん（スコア: ${userContext.score}pt）` : 'あなたのセキュリティコーチ'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🛡️</div>
            <p className="text-sm text-cyber-muted mb-6">何でも聞いてください。あなたのセキュリティ状況に合わせてAIが回答します。</p>
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
          onKeyDown={(e) => e.key === 'Enter' && !isTyping && handleSend()}
          placeholder="質問を入力..."
          className="flex-1 bg-cyber-card border border-cyber-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyber-glow/50"
          disabled={isTyping}
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || isTyping}
          className="px-5 py-3 bg-cyber-glow/10 text-cyber-glow border border-cyber-glow/30 rounded-xl text-sm font-medium hover:bg-cyber-glow/20 transition-all disabled:opacity-40"
        >
          送信
        </button>
      </div>
    </div>
  )
}

export default function AgentPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-cyber-glow/30 border-t-cyber-glow rounded-full animate-spin" /></div>}>
      <AgentContent />
    </Suspense>
  )
}
