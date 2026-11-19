'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { LayoutDashboard, FileQuestion, Flag, Megaphone, LogOut, ShieldCheck, ExternalLink, UserRound, MessageSquarePlus } from 'lucide-react'
import { getBrowserSupabase } from '@/lib/supabaseBrowser'

const NAV = [
  { href: '/admin', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/admin/questions', label: '問題管理', icon: FileQuestion },
  { href: '/admin/reports', label: '誤り報告', icon: Flag },
  { href: '/admin/feedback', label: 'ご意見', icon: MessageSquarePlus },
  { href: '/admin/announcements', label: 'お知らせ', icon: Megaphone },
]

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname === '/admin/login') return <>{children}</>
  const active = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href))

  async function logout() {
    await getBrowserSupabase()?.auth.signOut().catch(() => {})
    window.location.href = '/admin/login'
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <Link href="/admin" className="flex shrink-0 items-center gap-2 font-bold">
            <ShieldCheck className="h-6 w-6 text-accent" aria-hidden />
            <span className="hidden sm:inline">CSJ 資格ラボ</span>
            <span className="rounded-md bg-ink px-1.5 py-0.5 text-[11px] font-semibold text-bg">管理</span>
          </Link>
          <nav className="-mx-1 flex min-w-0 flex-1 gap-1 overflow-x-auto" aria-label="管理メニュー">
            {NAV.map(n => (
              <Link
                key={n.href}
                href={n.href}
                className={clsx(
                  'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors',
                  active(n.href) ? 'bg-accent-soft text-accent' : 'text-muted hover:text-ink',
                )}
              >
                <n.icon className="h-4 w-4" aria-hidden />
                <span className="hidden md:inline">{n.label}</span>
                <span className="sr-only md:hidden">{n.label}</span>
              </Link>
            ))}
          </nav>
          <Link href="/" target="_blank" className="hidden shrink-0 items-center gap-1 text-sm text-muted hover:text-ink sm:flex">
            アプリを開く<ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </Link>
          <Link href="/admin/account" className={clsx('shrink-0 rounded-lg p-1.5', pathname === '/admin/account' ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-sunken hover:text-ink')} title="アカウント">
            <UserRound className="h-4 w-4" aria-hidden />
            <span className="sr-only">アカウント</span>
          </Link>
          <button onClick={logout} className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-muted hover:bg-sunken hover:text-ink" title="ログアウト">
            <LogOut className="h-4 w-4" aria-hidden />
            <span className="sr-only">ログアウト</span>
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 pb-16">{children}</main>
    </div>
  )
}

/** 読み込み・エラー・未設定の表示 */
export function LoadState({ loading, error }: { loading: boolean; error: { message: string; code?: string } | null }) {
  if (error?.code === 'not_configured') {
    return (
      <div className="card p-6">
        <h2 className="font-bold">データベースが未設定です</h2>
        <p className="mt-2 text-sm text-muted">{error.message}</p>
        <p className="mt-2 text-sm text-muted">
          手順は README の「運用者用管理画面」を参照してください。
        </p>
      </div>
    )
  }
  if (error) return <div className="card border-ng/40 bg-ng-soft p-4 text-sm text-ng" role="alert">{error.message}</div>
  if (loading) return <div className="card animate-pulse p-6 text-sm text-muted">読み込み中…</div>
  return null
}
