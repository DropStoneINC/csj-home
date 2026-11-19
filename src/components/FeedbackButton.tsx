'use client'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { MessageSquarePlus, Loader2, Check } from 'lucide-react'
import { clientId, features } from '@/lib/telemetry'

const KINDS = [
  { id: 'feature', label: 'こんな機能がほしい' },
  { id: 'usability', label: '使いにくい・分かりにくい' },
  { id: 'bug', label: '不具合・うまく動かない' },
  { id: 'content', label: '問題・解説の内容について' },
  { id: 'other', label: 'その他' },
]

/** アプリへのご意見・改善要望を運用者に送る */
export default function FeedbackButton({ className }: { className?: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState('')
  const [message, setMessage] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  if (!features.reports) return null

  function start() {
    // 送信後にもう一度開いたときは新しいフォームにする
    if (state === 'sent') {
      setKind('')
      setMessage('')
      setState('idle')
    }
    setError(null)
    setOpen(true)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!kind) return setError('種類を選んでください。')
    if (!message.trim()) return setError('内容を入力してください。')
    setState('sending')
    setError(null)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, message, page: pathname, clientId: clientId() }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? '送信に失敗しました。')
      setState('sent')
    } catch (err) {
      setError((err as Error).message)
      setState('idle')
    }
  }

  return (
    <>
      <button onClick={start} className={className ?? 'inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink'}>
        <MessageSquarePlus className="h-4 w-4" aria-hidden />
        ご意見・改善要望を送る
      </button>
      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        onClick={e => e.target === dialogRef.current && setOpen(false)}
        className="w-[min(30rem,calc(100vw-2rem))] rounded-2xl text-left border border-line bg-surface p-0 text-ink backdrop:bg-black/40"
      >
        {state === 'sent' ? (
          <div className="p-6 text-center">
            <Check className="mx-auto h-8 w-8 text-ok" aria-hidden />
            <p className="mt-2 font-bold">送信しました</p>
            <p className="mt-1 text-sm text-muted">ご意見ありがとうございます。今後のアプリの改善に役立てます。</p>
            <button onClick={() => setOpen(false)} className="btn-ghost mt-5 w-full">閉じる</button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-5">
            <h2 className="font-bold">ご意見・改善要望</h2>
            <p className="mt-1 text-xs text-muted">送信内容は運用者だけが確認します。個別の返信はしていません。</p>
            <fieldset className="mt-4 space-y-1.5">
              <legend className="sr-only">種類</legend>
              {KINDS.map(k => (
                <label key={k.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-sunken">
                  <input type="radio" name="feedback-kind" value={k.id} checked={kind === k.id} onChange={() => setKind(k.id)} className="accent-[rgb(var(--accent))]" />
                  {k.label}
                </label>
              ))}
            </fieldset>
            <label className="mt-3 block text-sm">
              <span className="text-muted">内容（必須）</span>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                maxLength={2000}
                rows={5}
                className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none"
                placeholder="どの画面で、どうなるとうれしいかを教えてください"
              />
            </label>
            <p className="mt-1 text-right text-xs text-muted tabular">{message.length} / 2000</p>
            <p className="text-xs text-muted">氏名・メールアドレスなどの個人情報は書かないでください。</p>
            {error && <p className="mt-2 text-sm text-ng" role="alert">{error}</p>}
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setOpen(false)} className="btn-ghost flex-1">キャンセル</button>
              <button type="submit" disabled={state === 'sending'} className="btn-primary flex-1">
                {state === 'sending' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}送信する
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  )
}
