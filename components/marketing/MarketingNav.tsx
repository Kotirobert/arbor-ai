'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export function MarketingNav() {
  const [scrolled,     setScrolled]     = useState(false)
  const [menuOpen,     setMenuOpen]     = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close menu on resize past md breakpoint
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMenuOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
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

          {/* Desktop links — hidden below md */}
          <div className="nav__links hidden md:flex">
            <a href="#tools">Tools</a>
            <a href="#how">How it works</a>
            <a href="#pricing">Pricing</a>
          </div>

          {/* Desktop actions — hidden below md */}
          <div className="nav__actions hidden md:flex">
            <Link href="/sign-in" className="btn btn--sm">Sign in</Link>
            <Link href="/sign-up" className="btn btn--sm btn--primary">Start free</Link>
          </div>

          {/* Hamburger — visible below md only */}
          <button
            className="flex md:hidden items-center justify-center p-2 rounded-md"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 6h18M3 12h18M3 18h18"/>
              </svg>
            )}
          </button>
        </nav>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div
            className="md:hidden border-t border-[var(--line)] py-4 flex flex-col gap-1"
            style={{ background: 'var(--paper)' }}
          >
            <a
              href="#tools"
              className="px-2 py-3 text-sm rounded-md"
              style={{ color: 'var(--ink-2)' }}
              onClick={() => setMenuOpen(false)}
            >
              Tools
            </a>
            <a
              href="#how"
              className="px-2 py-3 text-sm rounded-md"
              style={{ color: 'var(--ink-2)' }}
              onClick={() => setMenuOpen(false)}
            >
              How it works
            </a>
            <a
              href="#pricing"
              className="px-2 py-3 text-sm rounded-md"
              style={{ color: 'var(--ink-2)' }}
              onClick={() => setMenuOpen(false)}
            >
              Pricing
            </a>
            <div className="flex gap-3 pt-2 border-t border-[var(--line)] mt-2">
              <Link href="/sign-in" className="btn btn--sm flex-1 justify-center" onClick={() => setMenuOpen(false)}>Sign in</Link>
              <Link href="/sign-up" className="btn btn--sm btn--primary flex-1 justify-center" onClick={() => setMenuOpen(false)}>Start free</Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
