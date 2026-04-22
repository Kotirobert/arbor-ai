import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  href?:      string
  className?: string
  size?:      'sm' | 'md' | 'lg'
}

export function Logo({ href = '/', className, size = 'md' }: LogoProps) {
  const sizeClass = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  }[size]

  const body = (
    <span className={cn('nav__brand', sizeClass, className)}>
      <span className="nav__brand-mark" />
      <span>ChalkAI</span>
    </span>
  )

  if (href) return <Link href={href as any} className="inline-block">{body}</Link>
  return body
}
