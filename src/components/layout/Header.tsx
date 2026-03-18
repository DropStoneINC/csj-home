'use client'
import Link from 'next/link'

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-cyber-surface/90 backdrop-blur-md border-b border-cyber-border/50 px-4 py-3 md:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 md:hidden">
          <div className="w-8 h-8 rounded-lg bg-cyber-glow/10 border border-cyber-glow/30 flex items-center justify-center">
            🛡️
          </div>
          <h1 className="text-sm font-bold text-cyber-glow tracking-wide">CYBER SHIELD</h1>
        </div>

        <div className="hidden md:block">
          <p className="text-sm text-cyber-muted">Cyber Shield Agent</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/threat/report"
            className="w-8 h-8 rounded-lg bg-cyber-red/10 border border-cyber-red/30 flex items-center justify-center text-sm hover:bg-cyber-red/20 transition-all"
            title="脅威通報"
          >
            🚨
          </Link>
          <Link
            href="/settings"
            className="w-8 h-8 rounded-lg bg-white/5 border border-cyber-border flex items-center justify-center text-sm hover:bg-white/10 transition-all"
            title="設定"
          >
            ⚙️
          </Link>
        </div>
      </div>
    </header>
  )
}
