'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { getSession } from '@/lib/auth/mockSession'
import type { UserRole } from '@/types'

const CHALKAI_ROUTE = '/chalkai' as Route
const REPORT_ROUTE = '/arbor/reports' as Route

interface ArborSidebarProps {
  role:          UserRole
  open?:         boolean
  onClose?:      () => void
  editMode?:     boolean
  onCustomise?:  () => void
}

export function ArborSidebar({ role, open = true, onClose, editMode, onCustomise }: ArborSidebarProps) {
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
  const isReport    = pathname === '/arbor/reports'

  return (
    <div className={open ? 'block' : 'hidden md:block'}>
      <aside className="app__sidebar">
        {/* Brand + close button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="nav__brand" style={{ fontSize: 22 }}>
            <span className="nav__brand-mark" />
            <span>ChalkAI</span>
          </div>
          {onClose && (
            <button
              className="flex md:hidden items-center justify-center p-1.5 rounded-md"
              onClick={onClose}
              aria-label="Close sidebar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>

        {/* Tool switcher */}
        <div className="tool-switch">
          <Link href={CHALKAI_ROUTE} className="tool-switch__btn">
            <svg className="ico" style={{ width: 13, height: 13 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21v-5l9-9 5 5-9 9H3z"/><path d="M12 7l5 5"/>
            </svg>
            Assistant
          </Link>
          <button className="tool-switch__btn tool-switch__btn--active">
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
            onClick={onClose}
          >
            <svg className="ico side-link__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/>
            </svg>
            Dashboard
          </Link>
          <Link
            href="/arbor/upload"
            className={`side-link${isUpload ? ' side-link--active' : ''}`}
            onClick={onClose}
          >
            <svg className="ico side-link__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
            </svg>
            Upload data
          </Link>
          <Link
            href={REPORT_ROUTE}
            className={`side-link${isReport ? ' side-link--active' : ''}`}
            onClick={onClose}
          >
            <svg className="ico side-link__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <path d="M14 2v6h6"/>
              <path d="M8 13h8M8 17h5"/>
            </svg>
            Reports
          </Link>
          {onCustomise && (
            <button
              onClick={() => { onCustomise(); onClose?.() }}
              className={`side-link${editMode ? ' side-link--active' : ''}`}
            >
              <svg className="ico side-link__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              {editMode ? 'Exit customise' : 'Customise'}
            </button>
          )}
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
    </div>
  )
}
