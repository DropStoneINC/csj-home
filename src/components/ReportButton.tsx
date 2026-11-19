'use client'
import { useEffect, useRef, useState } from 'react'
import { Flag, Loader2, Check } from 'lucide-react'
import { clientId, features } from '@/lib/telemetry'

const KINDS = [
  { id: 'wrong_answer', label: '正解が間違っている' },
  { id: 'explanation', label: '解説が間違っている・分かりにくい' },
  { id: 'typo', label: '誤字・脱字' },
  { id: 'outdated', label: '法改正などで内容が古い' },
  { id: 'other', label: 'その他' },
]

/** 問題の誤りを運用者に報告する */
export default function ReportButton({ questionId, selected }: { questionId: string; selected: number | null }) {
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState('')
  const [message, setMessage] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    setOpen(false)
    setKind('')
    setMessage('')
    setState('idle')
    setError(null)
  }, [questionId])

  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  if (!features.reports) return null

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!kind) return setError('報告の種類を選んでください。')
    setState('sending')
    setError(null)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, kind, message, selected, clientId: clientId() }),
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
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink">
        <Flag className="h-3.5 w-3.5" aria-hidden />
        {state === 'sent' ? '報告済み' : '問題の誤りを報告'}
      </button>
      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        onClick={e => e.target === dialogRef.current && setOpen(false)}
        className="w-[min(28rem,calc(100vw-2rem))] rounded-2xl text-left border border-line bg-surface p-0 text-ink backdrop:bg-black/40"
      >
        {state === 'sent' ? (
          <div className="p-6 text-center">
            <Check className="mx-auto h-8 w-8 text-ok" aria-hidden />
            <p className="mt-2 font-bold">報告を受け付けました</p>
            <p className="mt-1 text-sm text-muted">ご協力ありがとうございます。内容を確認して修正します。</p>
            <button onClick={() => setOpen(false)} className="btn-ghost mt-5 w-full">閉じる</button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-5">
            <h2 className="font-bold">問題の誤りを報告</h2>
            <p className="mt-1 text-xs text-muted">問題 {questionId}・送信内容は運用者だけが確認します</p>
            <fieldset className="mt-4 space-y-1.5">
              <legend className="sr-only">報告の種類</legend>
              {KINDS.map(k => (
                <label key={k.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-sunken">
                  <input type="radio" name="kind" value={k.id} checked={kind === k.id} onChange={() => setKind(k.id)} className="accent-[rgb(var(--accent))]" />
                  {k.label}
                </label>
              ))}
            </fieldset>
            <label className="mt-3 block text-sm">
              <span className="text-muted">詳しい内容{kind === 'other' ? '（必須）' : '（任意）'}</span>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                maxLength={1000}
                rows={4}
                className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none"
                placeholder="どこがどう違うか、根拠があれば教えてください"
              />
            </label>
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
