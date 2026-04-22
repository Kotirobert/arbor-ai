import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const PADDING = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' } as const

export function Card({ children, className, padding = 'md' }: CardProps) {
  return (
    <div className={cn('card', PADDING[padding], className)}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mb-4', className)}>{children}</div>
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn('text-sm font-semibold', className)} style={{ color: 'var(--ink)' }}>{children}</h3>
}

export function CardSubtitle({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('text-xs mt-0.5', className)} style={{ color: 'var(--ink-3)' }}>{children}</p>
}

export function CardDivider() {
  return <div style={{ height: 1, background: 'var(--line)', margin: '16px -28px' }} />
}
