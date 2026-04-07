import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type BadgeVariant = 'red' | 'amber' | 'blue' | 'green' | 'purple' | 'gray'

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  red:    'bg-red-50    text-red-700    border-red-200',
  amber:  'bg-amber-50  text-amber-700  border-amber-200',
  blue:   'bg-blue-50   text-blue-700   border-blue-200',
  green:  'bg-green-50  text-green-700  border-green-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  gray:   'bg-stone-100 text-stone-600  border-stone-200',
}

export function Badge({ variant = 'gray', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border',
        VARIANT_STYLES[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
