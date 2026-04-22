import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type BadgeVariant = 'red' | 'amber' | 'blue' | 'green' | 'purple' | 'gray'

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  red:    'tag tag--red',
  amber:  'tag tag--amber',
  blue:   'tag tag--blue',
  green:  'tag tag--green',
  purple: 'tag',
  gray:   'tag',
}

export function Badge({ variant = 'gray', children, className }: BadgeProps) {
  return (
    <span className={cn(VARIANT_STYLES[variant], className)}>
      {children}
    </span>
  )
}
