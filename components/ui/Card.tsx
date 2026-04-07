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
    <div className={cn('bg-white rounded-2xl border border-stone-200 shadow-card', PADDING[padding], className)}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mb-4', className)}>{children}</div>
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn('text-sm font-semibold text-stone-900', className)}>{children}</h3>
}

export function CardSubtitle({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('text-xs text-stone-400 mt-0.5', className)}>{children}</p>
}

export function CardDivider() {
  return <div className="h-px bg-stone-100 -mx-5 my-4" />
}
