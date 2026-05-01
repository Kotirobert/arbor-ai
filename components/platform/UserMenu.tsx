'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { signOut as clearLocalSession } from '@/lib/auth/mockSession'
import { signOutOfSupabase } from '@/lib/auth/supabaseAuth'

interface UserMenuProps {
  initials: string
  displayName: string
  subtitle: string
}

export function UserMenu({ initials, displayName, subtitle }: UserMenuProps) {
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    if (signingOut) return
    setSigningOut(true)
    await signOutOfSupabase()
    clearLocalSession()
    router.push('/sign-in' as any)
  }

  return (
    <div className="side-meta" style={{ cursor: 'default' }}>
      <div className="avatar">{initials}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500 }}>{displayName}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{subtitle}</div>
      </div>
      <Link
        href={'/settings' as Route}
        title="Settings"
        aria-label="Open settings"
        style={{
          color: 'var(--ink-3)',
          padding: 4,
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 8.97 3.6 1.7 1.7 0 0 0 10 2.04V2a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 8c.13.57.57 1.01 1.14 1.14H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15Z" />
        </svg>
      </Link>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        title="Sign out"
        aria-label="Sign out"
        style={{
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          color: 'var(--ink-3)',
          padding: 4,
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
      </button>
    </div>
  )
}
