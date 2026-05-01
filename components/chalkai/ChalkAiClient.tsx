'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'
import { ModeTabs, type ChalkAiMode } from './ModeTabs'
import { AssistantChat } from './AssistantChat'
import { GeneratorPanel } from './GeneratorPanel'
import { LibraryPanel } from './LibraryPanel'
import { UserMenu } from '@/components/platform/UserMenu'
import { getProfile, getSession } from '@/lib/auth/mockSession'
import {
  createChatThread,
  deleteChatThread,
  listChatThreads,
  saveChatThreadMessages,
  type ChatThread,
} from '@/lib/chalkai/chatHistoryStore'
import type { ChalkAiSession, TeacherProfile } from '@/types'
import type { ChatBubble } from './ChatMessage'

function modeFromSearch(sp: URLSearchParams | null): ChalkAiMode {
  return sp?.get('mode') === 'generator' ? 'generator' : 'assistant'
}

export function ChalkAiClient() {
  const router = useRouter()
  const search = useSearchParams()
  const pathname = usePathname()
  const isLibrary = pathname === '/chalkai/library'

  const [mode,         setMode]         = useState<ChalkAiMode>(() => modeFromSearch(search))
  const [session,      setSession]      = useState<ChalkAiSession | null>(null)
  const [profile,      setProfileState] = useState<TeacherProfile | null>(null)
  const [sidebarOpen,  setSidebarOpen]  = useState(false)
  const [messages,     setMessages]     = useState<ChatBubble[]>([])
  const [chatThreads,  setChatThreads]  = useState<ChatThread[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const activeChatIdRef = useRef<string | null>(null)

  useEffect(() => {
    setSession(getSession())
    setProfileState(getProfile())
    const threads = listChatThreads()
    setChatThreads(threads)
    if (threads[0]) {
      setActiveChatId(threads[0].id)
      activeChatIdRef.current = threads[0].id
      setMessages(threads[0].messages as ChatBubble[])
    }
  }, [])

  useEffect(() => {
    if (isLibrary) return
    const current = search?.get('mode')
    if (current !== mode) {
      const params = new URLSearchParams(search?.toString() ?? '')
      params.set('mode', mode)
      router.replace(`/chalkai?${params.toString()}` as any, { scroll: false })
    }
  }, [isLibrary, mode, router, search])

  // Close sidebar on wide screens
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setSidebarOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const handleMode = useCallback((m: ChalkAiMode) => setMode(m), [])

  const refreshChatThreads = useCallback(() => {
    setChatThreads(listChatThreads())
  }, [])

  const handleMessages = useCallback((nextMessages: ChatBubble[]) => {
    setMessages(nextMessages)

    if (nextMessages.length === 0) return

    const currentChatId = activeChatIdRef.current
    const persisted = currentChatId
      ? saveChatThreadMessages(currentChatId, nextMessages)
      : createChatThread({ messages: nextMessages })

    if (persisted) {
      activeChatIdRef.current = persisted.id
      setActiveChatId(persisted.id)
      refreshChatThreads()
    }
  }, [refreshChatThreads])

  const handleNewChat = useCallback(() => {
    handleMode('assistant')
    setSidebarOpen(false)
    activeChatIdRef.current = null
    setActiveChatId(null)
    setMessages([])
    if (isLibrary) router.push('/chalkai' as Route)
  }, [handleMode, isLibrary, router])

  const handleOpenChat = useCallback((thread: ChatThread) => {
    handleMode('assistant')
    setSidebarOpen(false)
    activeChatIdRef.current = thread.id
    setActiveChatId(thread.id)
    setMessages(thread.messages as ChatBubble[])
    if (isLibrary) router.push('/chalkai' as Route)
  }, [handleMode, isLibrary, router])

  const handleDeleteChat = useCallback((id: string) => {
    deleteChatThread(id)
    const nextThreads = listChatThreads()
    setChatThreads(nextThreads)

    if (activeChatId === id) {
      const nextThread = nextThreads[0]
      activeChatIdRef.current = nextThread?.id ?? null
      setActiveChatId(nextThread?.id ?? null)
      setMessages((nextThread?.messages ?? []) as ChatBubble[])
    }
  }, [activeChatId])

  const initials = session
    ? `${session.firstName?.[0] ?? ''}${session.lastName?.[0] ?? ''}`.toUpperCase() || 'TC'
    : 'TC'

  const yearGroups = profile?.yearGroups?.slice(0, 2).join(', ') ?? ''

  return (
    <div className="app">
      {/* Sidebar — hidden on mobile until hamburger opens it */}
      <div className={sidebarOpen ? 'block' : 'hidden md:block'}>
        <aside className="app__sidebar">
          <div className="flex items-center justify-between">
            <div className="nav__brand" style={{ fontSize: 22 }}>
              <span className="nav__brand-mark" />
              <span>ChalkAI</span>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-md text-[var(--ink2)] md:hidden"
              aria-label="Close menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
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

          {/* Workspace nav */}
          <div className="side-group">
            <div className="side-group__title">Workspace</div>
            <button
              onClick={handleNewChat}
              className={`side-link${!isLibrary && mode === 'assistant' && !activeChatId ? ' side-link--active' : ''}`}
            >
              <svg className="ico side-link__icon" viewBox="0 0 24 24">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
              New chat
            </button>
            <Link
              href={'/chalkai/library' as Route}
              onClick={() => setSidebarOpen(false)}
              className={`side-link${isLibrary ? ' side-link--active' : ''}`}
            >
              <svg className="ico side-link__icon" viewBox="0 0 24 24">
                <path d="M3 7h18M3 12h18M3 17h18"/>
              </svg>
              Library
            </Link>
          </div>

          {chatThreads.length > 0 && (
            <div className="side-group">
              <div className="side-group__title">Recent chats</div>
              <div className="flex flex-col gap-1">
                {chatThreads.slice(0, 8).map((thread) => (
                  <div
                    key={thread.id}
                    className={`group flex items-center gap-1 rounded-md ${
                      !isLibrary && activeChatId === thread.id ? 'bg-[var(--paper)] ring-1 ring-[var(--line)]' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleOpenChat(thread)}
                      className="min-w-0 flex-1 rounded-md px-3 py-2 text-left text-[13px] text-[var(--ink-2)] transition-colors hover:bg-[var(--paper-3)] hover:text-[var(--ink)]"
                      title={thread.title}
                    >
                      <span className="block truncate">{thread.title}</span>
                      <span className="block truncate text-[10.5px] text-[var(--ink-3)]">
                        {new Date(thread.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteChat(thread.id)}
                      className="mr-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-[var(--ink-3)] opacity-0 transition-opacity hover:bg-[var(--paper-3)] hover:text-[var(--ink)] group-hover:opacity-100 focus:opacity-100"
                      aria-label={`Delete ${thread.title}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <UserMenu
            initials={initials}
            displayName={session ? `${session.firstName} ${session.lastName}`.trim() : 'Teacher'}
            subtitle={yearGroups || 'ChalkAI'}
          />
        </aside>
      </div>

      {/* Main content */}
      <main className="app__main relative">
        {!sidebarOpen && (
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="fixed left-4 top-4 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border2)] bg-[var(--paper)] text-[var(--ink)] shadow-sm md:hidden"
            aria-label="Open menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        )}
        {/* Panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {isLibrary ? (
            <LibraryPanel />
          ) : mode === 'assistant' ? (
            <AssistantChat profile={profile} firstName={session?.firstName} messages={messages} onMessages={handleMessages} />
          ) : (
            <GeneratorPanel profile={profile} />
          )}
        </div>
      </main>
    </div>
  )
}
