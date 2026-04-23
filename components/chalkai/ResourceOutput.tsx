'use client'

import { useEffect, useState } from 'react'
import { streamText } from '@/lib/chalkai/mockAssistant'
import { RefinementBar } from './RefinementBar'
import { metaFor } from '@/lib/chalkai/resourceTemplates'
import type { ResourceType } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  type:      ResourceType
  title:     string
  markdown:  string
  onRefine:  (action: string) => void
  onSave:    () => void
  saved?:    boolean
}

// Reuse the light-markdown renderer logic from ChatMessage (kept small).
function renderInline(md: string): string {
  return md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|\s)_(.+?)_(?=\s|$)/g, '$1<em class="text-[var(--ink2)]">$2</em>')
    .replace(/`([^`]+)`/g, '<code class="rounded bg-[var(--surface3)] px-1.5 py-0.5 text-[0.85em]">$1</code>')
}

function renderBlocks(md: string): string {
  const lines = md.split('\n')
  const out:   string[] = []
  let inUl  = false
  let inOl  = false

  const closeLists = () => {
    if (inUl) { out.push('</ul>'); inUl = false }
    if (inOl) { out.push('</ol>'); inOl = false }
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    if (/^[-*]\s+/.test(line)) {
      if (!inUl) { closeLists(); out.push('<ul class="my-2 list-disc space-y-1.5 pl-5 text-[var(--ink)]">'); inUl = true }
      out.push(`<li>${renderInline(line.replace(/^[-*]\s+/, ''))}</li>`)
    } else if (/^\d+\.\s+/.test(line)) {
      if (!inOl) { closeLists(); out.push('<ol class="my-2 list-decimal space-y-1.5 pl-5 text-[var(--ink)]">'); inOl = true }
      out.push(`<li>${renderInline(line.replace(/^\d+\.\s+/, ''))}</li>`)
    } else if (/^#\s+/.test(line)) {
      closeLists()
      out.push(`<h1 class="mt-4 mb-2 font-serif text-[24px] italic text-[var(--ink)]">${renderInline(line.replace(/^#\s+/, ''))}</h1>`)
    } else if (/^##\s+/.test(line)) {
      closeLists()
      out.push(`<h2 class="mt-5 mb-2 font-display text-[15px] font-semibold uppercase tracking-wider text-[var(--amber)]">${renderInline(line.replace(/^##\s+/, ''))}</h2>`)
    } else if (/^###\s+/.test(line)) {
      closeLists()
      out.push(`<h3 class="mt-3 mb-1 font-display text-[13px] font-semibold text-[var(--ink)]">${renderInline(line.replace(/^###\s+/, ''))}</h3>`)
    } else if (/^---+$/.test(line)) {
      closeLists()
      out.push('<hr class="my-4 border-t border-[var(--border)]" />')
    } else if (line === '') {
      closeLists()
      out.push('<div class="h-2"></div>')
    } else {
      closeLists()
      out.push(`<p class="leading-relaxed text-[var(--ink)]">${renderInline(line)}</p>`)
    }
  }
  closeLists()
  return out.join('')
}

export function ResourceOutput({ type, title, markdown, onRefine, onSave, saved }: Props) {
  const [streamed, setStreamed]   = useState('')
  const [streaming, setStreaming] = useState(true)
  const [copied, setCopied]       = useState(false)
  const meta = metaFor(type)

  useEffect(() => {
    setStreamed('')
    setStreaming(true)
    const stop = streamText(
      markdown,
      (s) => setStreamed(s),
      () => setStreaming(false),
      6,
    )
    return stop
  }, [markdown])

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(markdown).catch(() => {})
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
              style={{ background: `var(${meta.cssVar})` }}
            />
            <span className="text-[11px] uppercase tracking-widest text-[var(--ink3)]">{meta.title}</span>
          </div>
          <h3 className="truncate font-serif text-[22px] italic text-[var(--ink)]">{title}</h3>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[var(--ink3)]">
          {streaming ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--amber)]" />
              Drafting
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--green)]" />
              Ready
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div
          className={cn('max-w-none text-[13.5px]', streaming && 'caret')}
          dangerouslySetInnerHTML={{ __html: renderBlocks(streamed) }}
        />
      </div>

      <RefinementBar
        onRefine={onRefine}
        onCopy={handleCopy}
        onSave={onSave}
        copied={copied}
        saved={saved}
      />
    </div>
  )
}
