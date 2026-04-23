'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChatMessage, type ChatBubble } from './ChatMessage'
import { SlashCommandHint } from './SlashCommandHint'
import { SLASH_COMMANDS } from '@/lib/chalkai/slashCommands'
import { mockReply, streamText } from '@/lib/chalkai/mockAssistant'
import type { TeacherProfile } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  profile:    TeacherProfile | null
  firstName?: string
}

const STARTERS: { label: string; prompt: string }[] = [
  { label: 'Draft a lesson plan',        prompt: 'Draft a lesson plan on fractions for Year 4, 45 mins, mixed ability.' },
  { label: 'Write a parent email',       prompt: 'Write a parent email about homework concerns for Year 5.' },
  { label: 'Make a 10-question quiz',    prompt: 'Make a 10-question quiz on the water cycle for Year 6.' },
  { label: 'Differentiated worksheet',   prompt: 'Differentiated worksheet on place value for Year 3.' },
  { label: '/retrieval on place value',  prompt: '/retrieval on place value' },
  { label: '/hinge on photosynthesis',   prompt: '/hinge on photosynthesis' },
]

export function AssistantChat({ profile, firstName }: Props) {
  const [messages, setMessages] = useState<ChatBubble[]>([])
  const [input, setInput]       = useState('')
  const [busy, setBusy]         = useState(false)
  const [hintIdx, setHintIdx]   = useState(0)

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const abortRef  = useRef<(() => void) | null>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    return () => abortRef.current?.()
  }, [])

  const send = useCallback((raw: string) => {
    const text = raw.trim()
    if (!text || busy) return

    const userMsg: ChatBubble = { id: `u-${Date.now()}`, role: 'user', body: text }
    const asstId = `a-${Date.now() + 1}`
    const reply  = mockReply(text, profile)

    setMessages((m) => [
      ...m,
      userMsg,
      { id: asstId, role: 'assistant', title: reply.title, body: '', streaming: true, options: reply.options },
    ])
    setInput('')
    setBusy(true)

    abortRef.current = streamText(
      reply.body,
      (soFar) => {
        setMessages((m) => m.map((msg) => (msg.id === asstId ? { ...msg, body: soFar } : msg)))
      },
      () => {
        setMessages((m) => m.map((msg) => (msg.id === asstId ? { ...msg, streaming: false } : msg)))
        setBusy(false)
        abortRef.current = null
      },
      9,
    )
  }, [busy, profile])

  const showHint = input.startsWith('/') && !input.includes(' ')
  const filteredHintCount = showHint
    ? SLASH_COMMANDS.filter((c) => c.cmd.slice(1).toLowerCase().startsWith(input.slice(1).toLowerCase())).length
    : 0

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showHint && filteredHintCount > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setHintIdx((i) => (i + 1) % filteredHintCount); return }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setHintIdx((i) => (i - 1 + filteredHintCount) % filteredHintCount); return }
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault()
        const matches = SLASH_COMMANDS.filter((c) => c.cmd.slice(1).toLowerCase().startsWith(input.slice(1).toLowerCase()))
        const pick = matches[hintIdx % matches.length]
        if (pick) setInput(pick.cmd + ' ')
        return
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  const hasMessages = messages.length > 0

  return (
    <div className="relative flex h-full flex-col">
      {/* Messages / empty state */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 pb-6 pt-4 md:px-8"
      >
        {!hasMessages ? (
          <div className="mx-auto max-w-2xl pt-6 md:pt-12">
            <div className="mb-8 text-center">
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#e8a32a,#c9801a)]">
                <span className="font-display text-lg font-bold text-[#0e0f0d]">C</span>
              </div>
              <h2 className="font-serif text-3xl italic text-[var(--ink)]">
                How can I help{firstName ? `, ${firstName}` : ''}?
              </h2>
              <p className="mt-2 text-sm text-[var(--ink2)]">
                Ask for a resource in plain English, or start with a slash command.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {STARTERS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => send(s.prompt)}
                  className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left transition-colors hover:border-[var(--amber-border)]"
                >
                  <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--ink)]">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--amber)]" />
                    {s.label}
                  </div>
                  <div className="mt-1 text-[11.5px] text-[var(--ink3)] group-hover:text-[var(--ink2)]">
                    {s.prompt}
                  </div>
                </button>
              ))}
            </div>

            <div className="chalkai-divider my-8" />

            <div className="text-center text-[11px] uppercase tracking-widest text-[var(--ink3)]">
              Slash commands
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {SLASH_COMMANDS.map((c) => (
                <button
                  key={c.cmd}
                  onClick={() => setInput(c.cmd + ' ')}
                  className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 font-mono text-[11px] text-[var(--ink2)] transition-colors hover:border-[var(--amber-border)] hover:text-[var(--amber)]"
                >
                  {c.cmd}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            {messages.map((m) => (
              <ChatMessage
                key={m.id}
                {...m}
                onOptionClick={(opt) => send(opt)}
              />
            ))}
            {busy && (
              <div className="ml-10 text-[11px] italic text-[var(--ink3)]">
                ChalkAI is drafting…
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="sticky bottom-0 border-t border-[var(--border)] bg-[rgba(14,15,13,0.88)] px-4 pb-4 pt-3 backdrop-blur-md md:px-8">
        <div className="relative mx-auto max-w-3xl">
          {showHint && (
            <SlashCommandHint
              query={input}
              active={hintIdx}
              onPick={(cmd) => { setInput(cmd); setHintIdx(0) }}
              onMove={(delta) => setHintIdx((i) => i + delta)}
            />
          )}
          <div className="flex items-end gap-2 rounded-2xl border border-[var(--border2)] bg-[var(--surface)] px-3 py-2 focus-within:border-[var(--amber-border)]">
            <textarea
              value={input}
              onChange={(e) => { setInput(e.target.value); setHintIdx(0) }}
              onKeyDown={handleKey}
              rows={1}
              placeholder={'Ask for a lesson plan, worksheet, email \u2014 or type "/" for shortcuts'}
              className="min-h-[28px] max-h-40 flex-1 resize-none bg-transparent px-2 py-1 text-[14px] text-[var(--ink)] outline-none placeholder:text-[var(--ink3)]"
            />
            <button
              onClick={() => send(input)}
              disabled={busy || input.trim().length === 0}
              className={cn(
                'inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-all',
                input.trim().length > 0 && !busy
                  ? 'bg-[var(--amber)] text-[#0e0f0d] hover:scale-[1.03]'
                  : 'bg-[var(--surface3)] text-[var(--ink3)]',
              )}
              aria-label="Send"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between px-1 text-[10.5px] text-[var(--ink3)]">
            <span>Press <kbd className="rounded bg-[var(--surface3)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--ink2)]">Enter</kbd> to send · <kbd className="rounded bg-[var(--surface3)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--ink2)]">/</kbd> for commands</span>
            <span>Responses are illustrative demos.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
