'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AssistantChat } from './AssistantChat'
import { getProfile, getSession } from '@/lib/auth/mockSession'
import type { ChalkAiSession, TeacherProfile } from '@/types'

export function ChalkAiClient() {
  const [session, setSession] = useState<ChalkAiSession | null>(null)
  const [profile, setProfileState] = useState<TeacherProfile | null>(null)

  useEffect(() => {
    setSession(getSession())
    setProfileState(getProfile())
  }, [])

  const initials = session
    ? `${session.firstName?.[0] ?? ''}${session.lastName?.[0] ?? ''}`.toUpperCase() || 'TC'
    : 'TC'

  const yearGroups = profile?.yearGroups?.slice(0, 2).join(', ') ?? ''

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="app__sidebar">
        <div className="nav__brand" style={{ fontSize: 22 }}>
          <span className="nav__brand-mark" />
          <span>ChalkAI</span>
        </div>

        {/* Tool switcher */}
        <div className="tool-switch">
          <button className="tool-switch__btn tool-switch__btn--active">
            <svg className="ico" style={{ width: 13, height: 13 }} viewBox="0 0 24 24">
              <path d="M3 21v-5l9-9 5 5-9 9H3z"/><path d="M12 7l5 5"/>
            </svg>
            Assistant
          </button>
          <Link href="/arbor/dashboard" className="tool-switch__btn">
            <svg className="ico" style={{ width: 13, height: 13 }} viewBox="0 0 24 24">
              <path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/>
            </svg>
            Arbor AI
          </Link>
        </div>

        {/* Nav */}
        <div className="side-group">
          <button
            className="side-link side-link--active"
            style={{ fontWeight: 600 }}
          >
            <svg className="ico side-link__icon" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            New chat
          </button>
          <button className="side-link">
            <svg className="ico side-link__icon" viewBox="0 0 24 24">
              <path d="M3 7h18M3 12h18M3 17h18"/>
            </svg>
            Library
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-3)' }}>47</span>
          </button>
        </div>

        {/* User meta */}
        <div className="side-meta">
          <div className="avatar">{initials}</div>
          <div>
            <div style={{ fontWeight: 500 }}>
              {session ? `${session.firstName} ${session.lastName}`.trim() : 'Teacher'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>
              {yearGroups || 'ChalkAI'}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="app__main">
        {/* Panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <AssistantChat profile={profile} firstName={session?.firstName} />
        </div>
      </main>
    </div>
  )
}
