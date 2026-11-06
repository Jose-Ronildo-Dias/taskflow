import { Link } from 'react-router'
import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn('h-8 w-8', className)}>
      <rect width="32" height="32" rx="8" fill="var(--primary)" />
      <path d="M7 21c4 0 5-10 9-10s5 10 9 10" fill="none" stroke="var(--primary-ink)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="25" cy="21" r="2.5" fill="var(--accent)" />
    </svg>
  )
}

export function Logo({ to = '/', className }: { to?: string; className?: string }) {
  return (
    <Link to={to} className={cn('inline-flex items-center gap-2.5 rounded-md', className)} aria-label="TaskFlow, página inicial">
      <LogoMark />
      <span className="font-display text-xl font-bold tracking-tight">TaskFlow</span>
    </Link>
  )
}
