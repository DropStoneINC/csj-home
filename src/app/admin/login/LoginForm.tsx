'use client'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ShieldCheck, Loader2 } from 'lucide-react'

type Props = { google: boolean; password: boolean; domains: string[] }

const ERRORS: Record<string, string> = {
  google_forbidden: 'このアカウントには管理画面の権限がありません。',
  google_cancelled: 'Google ログインがキャンセルされました。',
  google_expired: 'ログインの有効期限が切れました。もう一度お試しください。',
  google_failed: 'Google ログインに失敗しました。もう一度お試しください。',
  google_not_configured: 'Google ログインは設定されていません。',
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

function Form({ google, password: passwordEnabled, domains }: Props) {
  const params = useSearchParams()
  const next = params.get('next') ?? ''
  const errorCode = params.get('error')
  const deniedEmail = params.get('email')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(errorCode ? ERRORS[errorCode] ?? 'ログインに失敗しました。' : null)

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
      // 自サイトの管理画面以外には飛ばさない
      window.location.href = next && next.startsWith('/admin') && !next.startsWith('//') ? next : '/admin'
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  const googleHref = `/api/admin/google/start${next ? `?next=${encodeURIComponent(next)}` : ''}`

  return (
    <div className="card w-full max-w-sm p-6">
      <div className="flex items-center gap-2 font-bold">
        <ShieldCheck className="h-6 w-6 text-accent" aria-hidden />
        CSJ 資格ラボ 管理画面
      </div>

      {error && (
        <p className="mt-4 text-sm text-ng" role="alert">
          {error}
          {errorCode === 'google_forbidden' && deniedEmail && (
            <span className="mt-1 block text-muted">
              {deniedEmail} でログインしようとしました。{domains.length > 0 && <>{domains.map(d => `@${d}`).join('・')} のアカウントを選んでください。</>}
            </span>
          )}
        </p>
      )}

      {google && (
        <>
          <a href={googleHref} className="btn-ghost mt-6 w-full justify-center">
            <GoogleIcon />
            Google でログイン
          </a>
          {domains.length > 0 && <p className="mt-2 text-center text-xs text-muted">{domains.map(d => `@${d}`).join('・')} のアカウントのみ</p>}
        </>
      )}

      {google && passwordEnabled && (
        <div className="my-5 flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-line" />または<span className="h-px flex-1 bg-line" />
        </div>
      )}

      {passwordEnabled && (
        <form onSubmit={submit} className={google ? '' : 'mt-6'}>
          <label className="block text-sm">
            <span className="font-medium">運用者パスワード</span>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              autoFocus={!google}
              required
              className="mt-1.5 w-full rounded-xl border border-line bg-surface px-3 py-2.5 focus:border-accent focus:outline-none"
            />
          </label>
          <button type="submit" disabled={busy || !password} className="btn-primary mt-5 w-full">
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}ログイン
          </button>
        </form>
      )}

      {!google && !passwordEnabled && (
        <p className="mt-6 text-sm text-muted">
          管理画面は無効です。環境変数 <code className="rounded bg-sunken px-1">GOOGLE_CLIENT_ID</code>・<code className="rounded bg-sunken px-1">GOOGLE_CLIENT_SECRET</code>（または <code className="rounded bg-sunken px-1">ADMIN_PASSWORD</code>）を設定してください。
        </p>
      )}
    </div>
  )
}

export default function LoginForm(props: Props) {
  return (
    <Suspense>
      <Form {...props} />
    </Suspense>
  )
}
