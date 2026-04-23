'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { getSession } from '@/lib/auth/mockSession'
import type { UserRole } from '@/types'

interface ArborSidebarProps {
  role:       UserRole
  schoolName: string
  lastUpload: string
}

export function ArborSidebar({ role, schoolName, lastUpload }: ArborSidebarProps) {
  const pathname     = usePathname()
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [session, setSession] = useState<ReturnType<typeof getSession>>(null)

  useEffect(() => {
    setSession(getSession())
  }, [])

  const initials = session
    ? `${session.firstName?.[0] ?? ''}${session.lastName?.[0] ?? ''}`.toUpperCase() || 'AR'
    : 'AR'

  function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const p = new URLSearchParams(searchParams.toString())
    p.set('role', e.target.value)
    router.push(`/arbor/dashboard?${p.toString()}`)
  }

  const isDashboard = pathname === '/arbor/dashboard' || (pathname?.startsWith('/arbor/pupil') ?? false)
  const isUpload    = pathname === '/arbor/upload'

  return (
    <aside className="app__sidebar">
      {/* Brand + school info */}
      <div>
        <div className="nav__brand" style={{ fontSize: 22 }}>
          <span className="nav__brand-mark" />
          <span>Arbor AI</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4, paddingLeft: 30, lineHeight: 1.4 }}>
          {schoolName} · {lastUpload}
        </div>
      </div>

      {/* Tool switcher */}
      <div className="tool-switch">
        <button className="tool-switch__btn tool-switch__btn--active">
          <svg className="ico" style={{ width: 13, height: 13 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/>
          </svg>
          Arbor AI
        </button>
        <Link href="/chalkai" className="tool-switch__btn">
          <svg className="ico" style={{ width: 13, height: 13 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21v-5l9-9 5 5-9 9H3z"/><path d="M12 7l5 5"/>
          </svg>
          ChalkAI
        </Link>
      </div>

      {/* Workspace nav */}
      <div className="side-group">
        <div className="side-group__title">Workspace</div>
        <Link
          href="/arbor/dashboard"
          className={`side-link${isDashboard ? ' side-link--active' : ''}`}
        >
          <svg className="ico side-link__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/>
          </svg>
          Dashboard
        </Link>
        <Link
          href="/arbor/upload"
          className={`side-link${isUpload ? ' side-link--active' : ''}`}
        >
          <svg className="ico side-link__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
          </svg>
          Upload data
        </Link>
      </div>

      {/* View as */}
      <div className="side-group">
        <div className="side-group__title">View as</div>
        <div style={{ paddingLeft: 4, paddingRight: 4 }}>
          <select
            value={role}
            onChange={handleRoleChange}
            style={{
              width: '100%', padding: '8px 10px',
              border: '1px solid var(--line-2)', borderRadius: 6,
              fontSize: 12.5, fontFamily: 'var(--f-body)',
              background: 'var(--paper)', color: 'var(--ink)', cursor: 'pointer',
              appearance: 'auto',
            }}
          >
            <option value="slt">Headteacher / SLT</option>
            <option value="hoy">Head of Year</option>
            <option value="teacher">Class Teacher</option>
          </select>
        </div>
      </div>

      {/* User meta */}
      <div className="side-meta">
        <div className="avatar">{initials}</div>
        <div>
          <div style={{ fontWeight: 500 }}>
            {session ? `${session.firstName} ${session.lastName}`.trim() : 'School lead'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>Arbor AI</div>
        </div>
      </div>
    </aside>
  )
}
