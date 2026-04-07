'use client'

import { useState, useRef, type ChangeEvent, type KeyboardEvent } from 'react'
import { Card, CardHeader, CardTitle, CardSubtitle, CardDivider } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface AiActionsPanelProps {
  chips:   string[]
  prompts: string[]
}

export function AiActionsPanel({ chips, prompts }: AiActionsPanelProps) {
  const [query,    setQuery]    = useState('')
  const [response, setResponse] = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [history,  setHistory]  = useState<Array<{ q: string; a: string }>>([])
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleQuery(q: string) {
    if (!q.trim() || loading) return
    setLoading(true)
    setResponse(null)

    try {
      // Build rich context from uploaded school data
      let schoolContext: string | undefined
      try {
        const { getSchoolData }     = await import('@/lib/schoolStore')
        const { buildSchoolContext } = await import('@/lib/schoolContext')
        const stored = getSchoolData()
        if (stored?.pupils?.length) {
          schoolContext = buildSchoolContext(stored)
        }
      } catch { /* store not available server-side */ }

      // Include recent conversation history so follow-ups work
      const conversationHistory = history.slice(-4).map(h =>
        `User: ${h.q}\nAssistant: ${h.a}`
      ).join('\n\n')

      const res  = await fetch('/api/insights', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          role: 'slt',
          schoolContext,
          conversationHistory: conversationHistory || undefined,
        }),
      })

      const data = await res.json() as { response?: string; error?: string }
      const answer = data.response ?? data.error ?? 'No response generated.'

      setResponse(answer)
      setHistory(prev => [...prev, { q, a: answer }])
      setQuery('')
    } catch {
      setResponse('Unable to reach the server. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  function usePrompt(prompt: string) {
    setQuery(prompt)
    handleQuery(prompt)
    inputRef.current?.focus()
  }

  function handleClear() {
    setResponse(null)
    setHistory([])
    setQuery('')
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>AI assistant</CardTitle>
            <CardSubtitle>Ask anything about your school data</CardSubtitle>
          </div>
          {history.length > 0 && (
            <button
              onClick={handleClear}
              className="text-[11px] text-stone-400 hover:text-stone-600 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </CardHeader>

      {/* Quick action chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {chips.map((chip) => (
          <button
            key={chip}
            onClick={() => usePrompt(chip)}
            className={cn(
              'inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full',
              'border border-stone-200 bg-white text-stone-700',
              'hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600',
              'transition-all duration-150 cursor-pointer',
            )}
          >
            <SparkleIcon />
            {chip}
          </button>
        ))}
      </div>

      <CardDivider />

      {/* Conversation history */}
      {history.length > 0 && (
        <div className="mt-4 space-y-3 mb-4 max-h-72 overflow-y-auto">
          {history.map((turn, i) => (
            <div key={i} className="space-y-2">
              {/* User message */}
              <div className="flex justify-end">
                <div className="bg-stone-100 rounded-xl rounded-tr-sm px-3 py-2 max-w-[85%]">
                  <p className="text-xs text-stone-700">{turn.q}</p>
                </div>
              </div>
              {/* AI response */}
              <div className="flex justify-start">
                <div className="bg-brand-50 border border-brand-100 rounded-xl rounded-tl-sm px-3 py-2 max-w-[90%]">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <SparkleIcon className="text-brand-500" />
                    <span className="text-[10px] font-medium text-brand-600">Arbor AI</span>
                  </div>
                  <p className="text-xs text-stone-700 leading-relaxed whitespace-pre-line">{turn.a}</p>
                </div>
              </div>
            </div>
          ))}

          {/* Loading bubble */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-brand-50 border border-brand-100 rounded-xl rounded-tl-sm px-3 py-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <SparkleIcon className="text-brand-500" />
                  <span className="text-[10px] font-medium text-brand-600">Arbor AI</span>
                </div>
                <div className="flex gap-1 py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* First-response loading (no history yet) */}
      {loading && history.length === 0 && (
        <div className="mt-4 rounded-xl border border-stone-100 bg-stone-50 p-4 mb-4">
          <div className="flex items-center gap-2 text-xs text-brand-600 font-medium mb-2">
            <SparkleIcon className="text-brand-500" />
            Thinking…
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-stone-200 rounded animate-pulse w-4/5" />
            <div className="h-3 bg-stone-200 rounded animate-pulse w-3/5" />
            <div className="h-3 bg-stone-200 rounded animate-pulse w-2/3" />
          </div>
        </div>
      )}

      {/* Suggested prompts — show when no conversation yet */}
      {!loading && history.length === 0 && (
        <div className="mt-4 mb-4">
          <p className="text-[10px] text-stone-400 uppercase tracking-wide mb-2">Try asking</p>
          <div className="flex flex-wrap gap-1.5">
            {prompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => usePrompt(prompt)}
                className={cn(
                  'text-[11px] px-2.5 py-1 rounded-full cursor-pointer text-left',
                  'border border-stone-200 bg-white text-stone-500',
                  'hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50',
                  'transition-all duration-150',
                )}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className={cn('flex gap-2', history.length === 0 ? 'mt-0' : '')}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && !loading && handleQuery(query)}
          placeholder={history.length > 0 ? 'Ask a follow-up…' : 'Ask a question about your school data…'}
          className={cn(
            'flex-1 px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-stone-50',
            'placeholder:text-stone-400 text-stone-900',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:bg-white',
            'transition-all duration-150',
          )}
        />
        <Button
          variant="primary"
          size="md"
          onClick={() => handleQuery(query)}
          loading={loading}
          disabled={!query.trim() || loading}
        >
          Ask
        </Button>
      </div>
    </Card>
  )
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17 5.8 21.3l2.4-7.4L2 9.4h7.6z" />
    </svg>
  )
}
