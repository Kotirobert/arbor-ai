'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AssistantChat } from './AssistantChat'
import { type ChatBubble } from './ChatMessage'
import { getProfile, getSession } from '@/lib/auth/mockSession'
import type { ChalkAiSession, TeacherProfile } from '@/types'

export function ChalkAiClient() {
  const [session, setSession] = useState<ChalkAiSession | null>(null)
  const [profile, setProfileState] = useState<TeacherProfile | null>(null)
  const [messages, setMessages] = useState<ChatBubble[]>([])
  const [view, setView]         = useState<'chat' | 'library'>('chat')
  const [sidebarOpen, setSidebarOpen] = useState(true)

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
        <div className="nav__brand" style={{ fontSize: 22 }}>
          <span className="nav__brand-mark" />
          <span>ChalkAI</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="btn btn--ghost btn--sm"
            style={{ marginLeft: 'auto', padding: '4px 6px', lineHeight: 1 }}
            aria-label="Collapse sidebar"
          >
            <svg className="ico" viewBox="0 0 24 24" style={{ width: 15, height: 15 }}>
              <path d="M11 19l-7-7 7-7M18 19l-7-7 7-7"/>
            </svg>
          </button>
        </div>

        {/* Tool switcher */}
        <div className="tool-switch" style={{ position: 'relative' }}>
          {/* sliding pill */}
          <span style={{
            position: 'absolute',
            top: 3, bottom: 3, left: 3,
            width: 'calc(50% - 3px)',
            background: 'var(--ink)',
            borderRadius: 8,
            transition: 'left 220ms cubic-bezier(.4,0,.2,1)',
            pointerEvents: 'none',
          }} />
          <button
            className="tool-switch__btn"
            style={{ position: 'relative', zIndex: 1, color: 'var(--paper)' }}
          >
            <svg className="ico" style={{ width: 13, height: 13 }} viewBox="0 0 24 24">
              <path d="M3 21v-5l9-9 5 5-9 9H3z"/><path d="M12 7l5 5"/>
            </svg>
            Assistant
          </button>
          <Link href="/arbor/dashboard" className="tool-switch__btn" style={{ position: 'relative', zIndex: 1 }}>
            <svg className="ico" style={{ width: 13, height: 13 }} viewBox="0 0 24 24">
              <path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/>
            </svg>
            Arbor AI
          </Link>
        </div>

        {/* Nav */}
        <div className="side-group">
          <button
            onClick={() => { setMessages([]); setView('chat') }}
            className={`side-link${view === 'chat' ? ' side-link--active' : ''}`}
            style={{ fontWeight: 600 }}
          >
            <svg className="ico side-link__icon" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            New chat
          </button>
          <button
            onClick={() => setView('library')}
            className={`side-link${view === 'library' ? ' side-link--active' : ''}`}
          >
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

      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="btn btn--ghost btn--sm"
          style={{
            position: 'fixed', top: 16, left: 16, zIndex: 50,
            background: 'var(--paper)', border: '1px solid var(--line)',
            padding: '6px 8px', borderRadius: 8,
          }}
          aria-label="Open sidebar"
        >
          <svg className="ico" viewBox="0 0 24 24" style={{ width: 15, height: 15 }}>
            <path d="M3 12h18M3 6h18M3 18h18"/>
          </svg>
        </button>
      )}

      {/* Main content */}
      <main className="app__main">
        {/* Panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {view === 'library' ? (
            <div style={{ flex: 1, overflowY: 'auto', padding: '32px 28px' }}>
              <div className="eyebrow" style={{ marginBottom: 16 }}>Chat history</div>
              {messages.length === 0 ? (
                <p style={{ color: 'var(--ink-2)', fontSize: 14 }}>
                  No chats yet. Start a new chat to get going.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {messages
                    .filter((m) => m.role === 'user')
                    .map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setView('chat')}
                        className="side-link"
                        style={{ textAlign: 'left', fontSize: 13 }}
                      >
                        {m.body.slice(0, 60)}{m.body.length > 60 ? '\u2026' : ''}
                      </button>
                    ))}
                </div>
              )}
            </div>
          ) : (
            <AssistantChat
              profile={profile}
              firstName={session?.firstName}
              messages={messages}
              onMessages={setMessages}
            />
          )}
        </div>
      </main>
    </div>
  )
}
