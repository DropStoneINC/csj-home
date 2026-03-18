'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

const menuSections = [
  {
    title: '概要',
    items: [
      { label: 'ホーム', href: '/', icon: '🏠' },
      { label: 'ダッシュボード', href: '/dashboard', icon: '📊' },
    ],
  },
  {
    title: '診断',
    items: [
      { label: '自己診断', href: '/assessment/self', icon: '👤' },
      { label: '自社診断', href: '/assessment/company', icon: '🏢' },
      { label: 'メール/クラウド', href: '/assessment/email-cloud', icon: '✉️' },
    ],
  },
  {
    title: '学習',
    items: [
      { label: 'AIクラウドセキュリティ', href: '/learn/cloud-security', icon: '☁️' },
      { label: '情報セキュマネ', href: '/learn/security-management', icon: '📋' },
      { label: 'ITパスポート', href: '/learn/it-passport', icon: '🎓' },
    ],
  },
  {
    title: '脅威',
    items: [
      { label: '脅威通報', href: '/threat/report', icon: '🚨' },
      { label: '脅威検索DB', href: '/threat/search', icon: '🔎' },
    ],
  },
  {
    title: '実践',
    items: [
      { label: 'Cyber戦争', href: '/simulation/cyber-war', icon: '⚔️' },
      { label: 'ペンテスト', href: '/simulation/pentest', icon: '🔓' },
    ],
  },
  {
    title: 'AI',
    items: [
      { label: 'AIエージェント', href: '/agent', icon: '🤖' },
    ],
  },
  {
    title: 'その他',
    items: [
      { label: '設定', href: '/settings', icon: '⚙️' },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-cyber-surface border-r border-cyber-border/50 px-3 py-6 overflow-y-auto">
      <Link href="/" className="flex items-center gap-3 px-3 mb-8">
        <div className="w-9 h-9 rounded-lg bg-cyber-glow/10 border border-cyber-glow/30 flex items-center justify-center text-lg">
          🛡️
        </div>
        <div>
          <h1 className="text-sm font-bold text-cyber-glow tracking-wide">CYBER SHIELD</h1>
          <p className="text-[10px] text-cyber-muted tracking-widest">AGENT PWA</p>
        </div>
      </Link>

      {menuSections.map((section) => (
        <div key={section.title} className="mb-4">
          <p className="text-[10px] uppercase tracking-widest text-cyber-muted/60 px-3 mb-1.5">
            {section.title}
          </p>
          {section.items.map((item) => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all mb-0.5',
                  active
                    ? 'bg-cyber-glow/10 text-cyber-glow border border-cyber-glow/20'
                    : 'text-cyber-muted hover:text-cyber-text hover:bg-white/5'
                )}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      ))}
    </aside>
  )
}
