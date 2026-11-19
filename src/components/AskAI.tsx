'use client'
import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { Bot, Send, Loader2 } from 'lucide-react'

type Msg = { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = ['ほかの選択肢はなぜ違うの？', 'もっとかみくだいて説明して', '覚え方のコツは？', '関連して出題されやすい論点は？']

/** 問題ごとに Claude に質問できるパネル。問題が変わると会話はリセットされる */
export default function AskAI({ questionId, selected }: { questionId: string; selected: number | null }) {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    abortRef.current?.abort()
    setOpen(false)
    setMsgs([])
    setInput('')
    setBusy(false)
    setError(null)
  }, [questionId])

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' })
  }, [msgs])

  async function ask(text: string) {
    const content = text.trim()
    if (!content || busy) return
    const history: Msg[] = [...msgs, { role: 'user', content }]
    setMsgs([...history, { role: 'assistant', content: '' }])
    setInput('')
    setBusy(true)
    setError(null)
    const ctrl = new AbortController()
    abortRef.current = ctrl
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, selected, messages: history }),
        signal: ctrl.signal,
      })
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? 'AIに接続できませんでした。時間をおいて再度お試しください。')
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
        setMsgs([...history, { role: 'assistant', content: acc }])
      }
      if (!acc.trim()) throw new Error('回答を取得できませんでした。もう一度お試しください。')
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
      setMsgs(history.slice(0, -1))
      setInput(content)
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-ghost w-full">
        <Bot className="h-4 w-4 text-accent" aria-hidden />AIに質問する
      </button>
    )
  }

  return (
    <section className="card p-4" aria-label="AIに質問">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Bot className="h-4 w-4 text-accent" aria-hidden />AI解説
        <span className="font-normal text-muted">— この問題について何でも聞けます</span>
      </div>

      {msgs.length > 0 && (
        <div className="mb-3 max-h-[50vh] space-y-3 overflow-y-auto">
          {msgs.map((m, i) => (
            <div key={i} className={clsx('flex', m.role === 'user' && 'justify-end')}>
              <div
                className={clsx(
                  'max-w-[90%] whitespace-pre-wrap rounded-xl px-3.5 py-2.5 text-sm leading-7',
                  m.role === 'user' ? 'bg-accent text-accent-ink' : 'bg-sunken',
                )}
              >
                {m.content || <Loader2 className="h-4 w-4 animate-spin text-muted" aria-label="考え中" />}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      )}

      {msgs.length === 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => ask(s)} className="rounded-full border border-line px-3 py-1 text-xs hover:bg-sunken">
              {s}
            </button>
          ))}
        </div>
      )}

      {error && <p className="mb-2 text-sm text-ng">{error}</p>}

      <form
        onSubmit={e => {
          e.preventDefault()
          ask(input)
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          maxLength={500}
          placeholder="例: デジタル署名とMACの違いは？"
          className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          aria-label="質問"
        />
        <button type="submit" disabled={busy || !input.trim()} className="btn-primary px-3" aria-label="送信">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
        </button>
      </form>
      <p className="mt-2 text-[11px] text-muted">AIの回答は誤りを含むことがあります。重要な点は公式資料でも確認してください。</p>
    </section>
  )
}
