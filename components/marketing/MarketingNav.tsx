'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-30 w-full transition-all duration-200',
        scrolled ? 'border-b border-[var(--line)] bg-[var(--paper)]/95 backdrop-blur-md' : ''
      )}
    >
      <div className="container">
        <nav className="nav">
          <div className="nav__brand">
            <span className="nav__brand-mark" />
            <span>ChalkAI</span>
          </div>

          <div className="nav__links">
            <a href="#tools">Tools</a>
            <a href="#how">How it works</a>
            <a href="#pricing">Pricing</a>
          </div>

          <div className="nav__actions">
            <Link href="/sign-in" className="btn btn--sm">Sign in</Link>
            <Link href="/sign-up" className="btn btn--sm btn--primary">Start free</Link>
          </div>
        </nav>
      </div>
    </header>
  )
}
