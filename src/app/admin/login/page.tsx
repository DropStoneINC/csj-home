'use client'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ShieldCheck, Loader2 } from 'lucide-react'

function LoginForm() {
  const params = useSearchParams()
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error ?? 'ログインに失敗しました。')
      const next = params.get('next')
      // 自サイトの管理画面以外には飛ばさない
      window.location.href = next && next.startsWith('/admin') && !next.startsWith('//') ? next : '/admin'
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="card w-full max-w-sm p-6">
      <div className="flex items-center gap-2 font-bold">
        <ShieldCheck className="h-6 w-6 text-accent" aria-hidden />
        CSJ 資格ラボ 管理画面
      </div>
      <label className="mt-6 block text-sm">
        <span className="font-medium">運用者パスワード</span>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="current-password"
          autoFocus
          required
          className="mt-1.5 w-full rounded-xl border border-line bg-surface px-3 py-2.5 focus:border-accent focus:outline-none"
        />
      </label>
      {error && <p className="mt-3 text-sm text-ng" role="alert">{error}</p>}
      <button type="submit" disabled={busy || !password} className="btn-primary mt-5 w-full">
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}ログイン
      </button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  )
}
