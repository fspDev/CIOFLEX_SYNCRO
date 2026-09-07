import type { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
}

const variants: Record<string, string> = {
  primary: 'bg-[var(--brand-500)] hover:bg-[var(--brand-600)] text-white',
  secondary: 'bg-[var(--surface-2)] hover:brightness-110 text-[var(--text)] border border-[var(--border)]',
  danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30',
  ghost: 'bg-transparent hover:bg-[var(--surface-2)] text-[var(--text-muted)]',
}

export function Button({ variant = 'primary', className = '', ...props }: Props) {
  return (
    <button
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    />
  )
}
