'use client'
import { useState } from 'react'
import { Cloud, CloudOff, Loader2, LogOut, Mail, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'
import { supabaseEnabled } from '@/lib/supabase'
import { useSync, signInWithEmail, signOut, syncNow } from '@/lib/sync'
import { useProgress, overallStats } from '@/lib/progress'
import { PageTitle } from '@/components/ui'

export default function AccountPage() {
  const sync = useSync()
  const p = useProgress()
  const all = overallStats(p)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!supabaseEnabled) {
    return (
      <div>
        <PageTitle title="アカウント" />
        <p className="card p-5 text-sm text-muted">端末間の同期機能は現在利用できません。</p>
      </div>
    )
  }

  if (!sync.ready) return <div className="py-20 text-center text-muted">読み込み中…</div>

  if (sync.session) {
    const statusView = {
      off: { icon: CloudOff, text: '未同期', tone: 'text-muted' },
      syncing: { icon: Loader2, text: '同期しています…', tone: 'text-muted' },
      synced: { icon: CheckCircle2, text: '同期済み', tone: 'text-ok' },
      error: { icon: AlertCircle, text: '同期に失敗しました。通信環境を確認してください。', tone: 'text-ng' },
    }[sync.status]
    return (
      <div className="max-w-lg">
        <PageTitle title="アカウント" description="学習記録はこのアカウントに保存され、ログインしたすべての端末で共有されます。" />
        <section className="card space-y-4 p-5">
          <div>
            <div className="text-xs text-muted">ログイン中</div>
            <div className="font-semibold">{sync.session.user.email}</div>
          </div>
          <div className={`flex items-center gap-2 text-sm ${statusView.tone}`}>
            <statusView.icon className={`h-4 w-4 ${sync.status === 'syncing' ? 'animate-spin' : ''}`} aria-hidden />
            {statusView.text}
            {sync.lastSyncedAt && sync.status === 'synced' && (
              <span className="text-muted">（{new Date(sync.lastSyncedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}）</span>
            )}
          </div>
          <div className="text-sm text-muted">解答済み {all.answered}問・ブックマーク {p.bookmarks.length}件・履歴 {p.sessions.length}件</div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => void syncNow()} className="btn-ghost" disabled={sync.status === 'syncing'}>
              <RefreshCw className="h-4 w-4" aria-hidden />今すぐ同期
            </button>
            <button onClick={() => void signOut()} className="btn-ghost text-ng">
              <LogOut className="h-4 w-4" aria-hidden />ログアウト
            </button>
          </div>
        </section>
        <p className="mt-3 text-xs text-muted">ログアウトしても、この端末の学習記録は残ります。</p>
      </div>
    )
  }

  return (
    <div className="max-w-lg">
      <PageTitle title="ログイン" description="ログインすると学習記録がクラウドに保存され、スマホとPCなど複数の端末で続きから学習できます。ログインしなくても、すべての機能を使えます。" />
      <section className="card p-5">
        {sent ? (
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 font-semibold"><Mail className="h-4 w-4 text-accent" aria-hidden />メールを送信しました</div>
            <p className="text-muted"><span className="font-medium text-ink">{email}</span> に届いたメールのリンクを開くとログインできます。届かない場合は迷惑メールフォルダも確認してください。</p>
            <button onClick={() => setSent(false)} className="text-accent hover:underline">メールアドレスを変更する</button>
          </div>
        ) : (
          <form
            onSubmit={async e => {
              e.preventDefault()
              setBusy(true)
              setError(null)
              try {
                await signInWithEmail(email.trim())
                setSent(true)
              } catch (err) {
                const msg = (err as Error).message ?? ''
                setError(/rate limit|security purposes/i.test(msg) ? '短時間に送信が続いたため、少し時間をおいてから再度お試しください。' : 'メールを送信できませんでした。アドレスを確認してもう一度お試しください。')
              } finally {
                setBusy(false)
              }
            }}
            className="space-y-3"
          >
            <label htmlFor="email" className="block text-sm font-medium">メールアドレス</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
            {error && <p className="text-sm text-ng">{error}</p>}
            <button type="submit" disabled={busy || !email.trim()} className="btn-primary w-full">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Cloud className="h-4 w-4" aria-hidden />}
              ログイン用のリンクを送る
            </button>
            <p className="text-xs text-muted">パスワードは不要です。初めての方はそのままアカウントが作成されます。この端末にある学習記録は、ログイン後にアカウントへ引き継がれます。</p>
          </form>
        )}
      </section>
    </div>
  )
}
