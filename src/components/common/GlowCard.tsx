'use client'
import { ReactNode } from 'react'
import clsx from 'clsx'

interface GlowCardProps {
  children: ReactNode
  className?: string
  glowColor?: 'cyan' | 'green' | 'red' | 'purple' | 'yellow'
  hover?: boolean
  onClick?: () => void
}

const glowMap = {
  cyan: 'hover:shadow-cyber border-cyber-border',
  green: 'hover:shadow-cyber-green border-green-900/30',
  red: 'hover:shadow-cyber-red border-red-900/30',
  purple: 'hover:border-purple-500/30 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)]',
  yellow: 'hover:border-yellow-500/30 hover:shadow-[0_0_15px_rgba(255,204,0,0.15)]',
}

export default function GlowCard({
  children,
  className = '',
  glowColor = 'cyan',
  hover = true,
  onClick,
}: GlowCardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-cyber-card rounded-xl border border-cyber-border/50 p-5 transition-all duration-300',
        hover && glowMap[glowColor],
        hover && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}
