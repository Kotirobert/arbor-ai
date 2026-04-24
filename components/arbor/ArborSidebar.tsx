'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { getSession } from '@/lib/auth/mockSession'
import type { Route } from 'next'
import type { UserRole } from '@/types'

interface ArborSidebarProps {
  role:         UserRole
  editMode:     boolean
  onToggleEdit: () => void
  sidebarOpen:  boolean
  onCollapse:   () => void
}

export function ArborSidebar({ role, editMode, onToggleEdit, sidebarOpen, onCollapse }: ArborSidebarProps) {
  const pathname     = usePathname()
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [session, setSession] = useState<ReturnType<typeof getSession>>(null)

  useEffect(() => {
    setSession(getSession())
  }, [])

  function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const p = new URLSearchParams(searchParams.toString())
    p.set('role', e.target.value)
    router.push(`/arbor/dashboard?${p.toString()}`)
  }

  const isDashboard = pathname === '/arbor/dashboard' || (pathname?.startsWith('/arbor/pupil') ?? false)
  const isUpload    = pathname === '/arbor/upload'

  return (
    <aside
      className="app__sidebar"
      style={{
        width: sidebarOpen ? undefined : 0,
        minWidth: sidebarOpen ? undefined : 0,
        overflow: sidebarOpen ? 'visible' : 'hidden',
        padding: sidebarOpen ? undefined : 0,
        transition: 'width 220ms cubic-bezier(.4,0,.2,1), min-width 220ms cubic-bezier(.4,0,.2,1)',
      }}
    >
      {/* Brand + school info */}
      <div>
        <div className="nav__brand" style={{ fontSize: 22 }}>
          <span className="nav__brand-mark" />
          <span>Arbor AI</span>
          <button
            onClick={onCollapse}
            className="btn btn--ghost btn--sm"
            style={{ marginLeft: 'auto', padding: '4px 6px', lineHeight: 1 }}
            aria-label="Collapse sidebar"
          >
            <svg className="ico" viewBox="0 0 24 24" style={{ width: 15, height: 15 }}>
              <path d="M11 19l-7-7 7-7M18 19l-7-7 7-7"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Tool switcher */}
      <div className="tool-switch" style={{ position: 'relative' }}>
        {/* sliding pill */}
        <span style={{
          position: 'absolute',
          top: 3, bottom: 3, left: '50%',
          width: 'calc(50% - 3px)',
          background: 'var(--ink)',
          borderRadius: 8,
          transition: 'left 220ms cubic-bezier(.4,0,.2,1)',
          pointerEvents: 'none',
        }} />
        <Link href={"/chalkai" as Route} className="tool-switch__btn" style={{ position: 'relative', zIndex: 1 }}>
          <svg className="ico" style={{ width: 13, height: 13 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21v-5l9-9 5 5-9 9H3z"/><path d="M12 7l5 5"/>
          </svg>
          Assistant
        </Link>
        <button
          className="tool-switch__btn"
          style={{ position: 'relative', zIndex: 1, color: 'var(--paper)' }}
        >
          <svg className="ico" style={{ width: 13, height: 13 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/>
          </svg>
          Arbor AI
        </button>
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
        <button
          onClick={onToggleEdit}
          className={`side-link${editMode ? ' side-link--active' : ''}`}
        >
          <svg className="ico side-link__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/>
          </svg>
          {editMode ? 'Exit customise' : 'Customise'}
        </button>
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
