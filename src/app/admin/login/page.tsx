'use client'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ShieldCheck, Loader2 } from 'lucide-react'
import { getBrowserSupabase } from '@/lib/supabaseBrowser'

function LoginForm() {
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = getBrowserSupabase()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setBusy(true)
    setError(null)
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (authError) {
        throw new Error(authError.message.includes('Invalid login') ? 'メールアドレスまたはパスワードが正しくありません。' : `ログインに失敗しました（${authError.message}）`)
      }
      const { data: isAdmin } = await supabase.rpc('is_admin')
      if (isAdmin !== true) {
        await supabase.auth.signOut()
        throw new Error('このアカウントには管理画面の権限がありません。')
      }
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
      {!supabase ? (
        <p className="mt-6 text-sm text-ng">Supabase が未設定です（NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY）。</p>
      ) : (
        <>
          <label className="mt-6 block text-sm">
            <span className="font-medium">メールアドレス</span>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="username"
              autoFocus
              required
              className="mt-1.5 w-full rounded-xl border border-line bg-surface px-3 py-2.5 focus:border-accent focus:outline-none"
            />
          </label>
          <label className="mt-4 block text-sm">
            <span className="font-medium">パスワード</span>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="mt-1.5 w-full rounded-xl border border-line bg-surface px-3 py-2.5 focus:border-accent focus:outline-none"
            />
          </label>
          {error && <p className="mt-3 text-sm text-ng" role="alert">{error}</p>}
          <button type="submit" disabled={busy || !email || !password} className="btn-primary mt-5 w-full">
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}ログイン
          </button>
        </>
      )}
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
