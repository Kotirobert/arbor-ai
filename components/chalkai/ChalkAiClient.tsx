'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ModeTabs, type ChalkAiMode } from './ModeTabs'
import { AssistantChat } from './AssistantChat'
import { GeneratorPanel } from './GeneratorPanel'
import { getProfile, getSession } from '@/lib/auth/mockSession'
import type { ChalkAiSession, TeacherProfile } from '@/types'
import type { ChatBubble } from './ChatMessage'

function modeFromSearch(sp: URLSearchParams | null): ChalkAiMode {
  return sp?.get('mode') === 'generator' ? 'generator' : 'assistant'
}

export function ChalkAiClient() {
  const router = useRouter()
  const search = useSearchParams()

  const [mode,         setMode]         = useState<ChalkAiMode>(() => modeFromSearch(search))
  const [session,      setSession]      = useState<ChalkAiSession | null>(null)
  const [profile,      setProfileState] = useState<TeacherProfile | null>(null)
  const [sidebarOpen,  setSidebarOpen]  = useState(false)
  const [messages,     setMessages]     = useState<ChatBubble[]>([])

  useEffect(() => {
    setSession(getSession())
    setProfileState(getProfile())
  }, [])

  useEffect(() => {
    const current = search?.get('mode')
    if (current !== mode) {
      const params = new URLSearchParams(search?.toString() ?? '')
      params.set('mode', mode)
      router.replace(`/chalkai?${params.toString()}` as any, { scroll: false })
    }
  }, [mode, router, search])

  // Close sidebar on wide screens
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setSidebarOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const handleMode = useCallback((m: ChalkAiMode) => setMode(m), [])

  const initials = session
    ? `${session.firstName?.[0] ?? ''}${session.lastName?.[0] ?? ''}`.toUpperCase() || 'TC'
    : 'TC'

  const yearGroups = profile?.yearGroups?.slice(0, 2).join(', ') ?? ''

  return (
    <div className="app">
      {/* Sidebar — hidden on mobile until hamburger opens it */}
      <div className={sidebarOpen ? 'block' : 'hidden md:block'}>
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
              ChalkAI
            </button>
            <Link href="/arbor/dashboard" className="tool-switch__btn">
              <svg className="ico" style={{ width: 13, height: 13 }} viewBox="0 0 24 24">
                <path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/>
              </svg>
              Arbor AI
            </Link>
          </div>

          {/* Workspace nav */}
          <div className="side-group">
            <div className="side-group__title">Workspace</div>
            <button
              onClick={() => { handleMode('assistant'); setSidebarOpen(false) }}
              className={`side-link${mode === 'assistant' ? ' side-link--active' : ''}`}
            >
              <svg className="ico side-link__icon" viewBox="0 0 24 24">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
              Assistant
            </button>
            <button
              onClick={() => { handleMode('generator'); setSidebarOpen(false) }}
              className={`side-link${mode === 'generator' ? ' side-link--active' : ''}`}
            >
              <svg className="ico side-link__icon" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/>
              </svg>
              Generator
            </button>
            <div className="side-link">
              <svg className="ico side-link__icon" viewBox="0 0 24 24">
                <path d="M3 7h18M3 12h18M3 17h18"/>
              </svg>
              Library
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-3)' }}>47</span>
            </div>
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
      </div>

      {/* Main content */}
      <main className="app__main">
        {/* Topbar */}
        <div style={{
          height: 64, borderBottom: '1px solid var(--line)', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', padding: '0 28px',
          background: 'var(--paper)', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Hamburger — mobile only */}
            <button
              className="flex md:hidden items-center justify-center p-1.5 rounded-md mr-1"
              onClick={() => setSidebarOpen((o) => !o)}
              aria-label="Toggle sidebar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 6h18M3 12h18M3 18h18"/>
              </svg>
            </button>
            <div style={{ fontFamily: 'var(--f-body)', fontSize: 13, color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>ChalkAI</span>
              <span style={{ color: 'var(--ink-3)' }}>/</span>
              <span style={{ color: 'var(--ink)', fontWeight: 500 }}>
                {mode === 'assistant' ? 'Assistant' : 'Generator'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {profile && (
              <span className="tag tag--green">
                <span className="tag__dot" />
                Profile active
              </span>
            )}
            <ModeTabs value={mode} onChange={handleMode} />
          </div>
        </div>

        {/* Panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {mode === 'assistant' ? (
            <AssistantChat profile={profile} firstName={session?.firstName} messages={messages} onMessages={setMessages} />
          ) : (
            <GeneratorPanel profile={profile} />
          )}
        </div>
      </main>
    </div>
  )
}
