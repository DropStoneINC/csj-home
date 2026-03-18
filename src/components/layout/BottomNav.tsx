'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

const navItems = [
  { label: 'ホーム', href: '/', icon: '🏠' },
  { label: 'スコア', href: '/dashboard', icon: '📊' },
  { label: '診断', href: '/assessment/self', icon: '🔍' },
  { label: '学習', href: '/learn/cloud-security', icon: '📚' },
  { label: '脅威', href: '/threat/search', icon: '🛡️' },
  { label: 'AI', href: '/agent', icon: '🤖' },
]

export default function BottomNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href.split('/').slice(0, 2).join('/'))
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-cyber-surface/95 backdrop-blur-md border-t border-cyber-border/50 md:hidden">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex flex-col items-center py-2 px-3 rounded-lg transition-all text-[11px]',
              isActive(item.href)
                ? 'text-cyber-glow'
                : 'text-cyber-muted hover:text-cyber-text'
            )}
          >
            <span className="text-lg mb-0.5">{item.icon}</span>
            <span>{item.label}</span>
            {isActive(item.href) && (
              <div className="absolute bottom-0 w-8 h-0.5 bg-cyber-glow rounded-full" />
            )}
          </Link>
        ))}
      </div>
    </nav>
  )
}
