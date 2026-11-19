'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { Home, BookOpen, Timer, RotateCcw, ShieldCheck, Cloud, CloudOff, UserRound } from 'lucide-react'
import { useSync, useSyncEngine } from '@/lib/sync'
import { supabaseEnabled } from '@/lib/supabase'

const NAV = [
  { href: '/', label: 'ホーム', icon: Home },
  { href: '/practice', label: '分野別演習', icon: BookOpen },
  { href: '/mock', label: '模擬試験', icon: Timer },
  { href: '/review', label: '復習・記録', icon: RotateCcw },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  useSyncEngine()
  const sync = useSync()
  // 問題を解いている間はナビを隠して集中できるようにする
  const focus = pathname.startsWith('/quiz')
  const active = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  return (
    <div className="flex min-h-screen flex-col">
      {!focus && (
        <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2 font-bold">
              <ShieldCheck className="h-6 w-6 text-accent" aria-hidden />
              <span>CSJ 資格ラボ</span>
            </Link>
            <div className="flex items-center gap-1">
            <nav className="hidden gap-1 sm:flex" aria-label="メイン">
              {NAV.map(n => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={clsx(
                    'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                    active(n.href) ? 'bg-accent-soft text-accent' : 'text-muted hover:text-ink',
                  )}
                >
                  {n.label}
                </Link>
              ))}
            </nav>
            {supabaseEnabled && sync.ready && (
              <Link
                href="/account"
                className={clsx(
                  'ml-1 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors',
                  active('/account') ? 'bg-accent-soft text-accent' : 'text-muted hover:text-ink',
                )}
                title={sync.session ? `${sync.session.user.email} でログイン中` : 'ログインして端末間で同期'}
              >
                {sync.session ? (
                  sync.status === 'error' ? <CloudOff className="h-4 w-4 text-ng" aria-hidden /> : <Cloud className="h-4 w-4 text-ok" aria-hidden />
                ) : (
                  <UserRound className="h-4 w-4" aria-hidden />
                )}
                <span>{sync.session ? '同期中' : 'ログイン'}</span>
              </Link>
            )}
            </div>
          </div>
        </header>
      )}
      <main className={clsx('mx-auto w-full max-w-4xl flex-1 px-4', focus ? 'py-4' : 'py-6 pb-28 sm:pb-10')}>{children}</main>
      {!focus && (
        <nav
          className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
          aria-label="メイン"
        >
          <div className="grid grid-cols-4">
            {NAV.map(n => (
              <Link
                key={n.href}
                href={n.href}
                className={clsx('flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium', active(n.href) ? 'text-accent' : 'text-muted')}
              >
                <n.icon className="h-5 w-5" aria-hidden />
                {n.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  )
}
