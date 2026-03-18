'use client'
import { ReactNode } from 'react'
import clsx from 'clsx'

export interface CyberButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  disabled?: boolean
  onClick?: () => void
  type?: 'button' | 'submit'
  className?: string
}

export default function CyberButton({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  onClick,
  type = 'button',
  className,
}: CyberButtonProps) {
  const baseClasses = 'font-semibold rounded-lg transition-all duration-300 inline-flex items-center justify-center gap-2'

  const variants = {
    primary: 'bg-cyber-glow/10 text-cyber-glow border border-cyber-glow/30 hover:bg-cyber-glow/20 hover:shadow-cyber',
    secondary: 'bg-cyber-card text-cyber-text border border-cyber-border hover:border-cyber-glow/30',
    danger: 'bg-cyber-red/10 text-cyber-red border border-cyber-red/30 hover:bg-cyber-red/20',
    ghost: 'text-cyber-muted hover:text-cyber-text hover:bg-white/5',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        baseClasses,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        disabled && 'opacity-40 cursor-not-allowed',
        className,
      )}
    >
      {children}
    </button>
  )
}
