'use client'
import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { Loader2 } from 'lucide-react'
import { getBrowserSupabase } from '@/lib/supabaseBrowser'

export default function AccountPage() {
  const supabase = getBrowserSupabase()
  const [email, setEmail] = useState<string | null>(null)
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    void supabase?.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
  }, [supabase])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) return
    if (pw.length < 12) return setMsg({ ok: false, text: 'パスワードは12文字以上にしてください。' })
    if (pw !== pw2) return setMsg({ ok: false, text: '確認用のパスワードが一致しません。' })
    setBusy(true)
    setMsg(null)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setBusy(false)
    if (error) return setMsg({ ok: false, text: `変更できませんでした（${error.message}）` })
    setPw('')
    setPw2('')
    setMsg({ ok: true, text: 'パスワードを変更しました。' })
  }

  const input = 'mt-1.5 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm focus:border-accent focus:outline-none'
  return (
    <div className="max-w-md space-y-5">
      <div>
        <h1 className="text-2xl font-bold">アカウント</h1>
        <p className="mt-1 text-sm text-muted">ログイン中: {email ?? '…'}</p>
      </div>
      <form onSubmit={submit} className="card space-y-4 p-5">
        <h2 className="font-bold">パスワードの変更</h2>
        <input type="email" value={email ?? ''} autoComplete="username" readOnly hidden />
        <label className="block text-sm">
          <span className="font-medium">新しいパスワード</span>
          <span className="ml-2 text-xs text-muted">12文字以上</span>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} autoComplete="new-password" className={input} />
        </label>
        <label className="block text-sm">
          <span className="font-medium">新しいパスワード（確認）</span>
          <input type="password" value={pw2} onChange={e => setPw2(e.target.value)} autoComplete="new-password" className={input} />
        </label>
        {msg && <p className={clsx('rounded-xl px-3 py-2 text-sm', msg.ok ? 'bg-ok-soft text-ok' : 'bg-ng-soft text-ng')} role="status">{msg.text}</p>}
        <button type="submit" disabled={busy || !pw} className="btn-primary w-full">
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}変更する
        </button>
      </form>
      <p className="text-xs text-muted">
        運用者を追加するときは、Supabase の Authentication でユーザーを作成し、SQL Editor で
        <code className="mx-1 rounded bg-sunken px-1">insert into public.admin_users (email) values (&apos;…&apos;);</code>
        を実行してください。
      </p>
    </div>
  )
}
