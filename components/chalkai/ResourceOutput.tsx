'use client'

import { useEffect, useState } from 'react'
import { streamText } from '@/lib/chalkai/mockAssistant'
import { RefinementBar } from './RefinementBar'
import type { GenerateResponse } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  response: GenerateResponse & { type: 'text' | 'image' | 'pptx' }
  topic:    string
  onSave:   () => void
  saved?:   boolean
}

function renderInline(md: string): string {
  return md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|\s)_(.+?)_(?=\s|$)/g, '$1<em class="text-[var(--ink2)]">$2</em>')
    .replace(/`([^`]+)`/g, '<code class="rounded bg-[var(--surface3)] px-1.5 py-0.5 text-[0.85em]">$1</code>')
}

function renderBlocks(md: string): string {
  const lines = md.split('\n')
  const out: string[] = []
  let inUl = false, inOl = false
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
    } else if (/^#\s+/.test(line))  { closeLists(); out.push(`<h1 class="mt-4 mb-2 font-serif text-[24px] italic text-[var(--ink)]">${renderInline(line.replace(/^#\s+/, ''))}</h1>`) }
    else if (/^##\s+/.test(line))   { closeLists(); out.push(`<h2 class="mt-5 mb-2 font-display text-[15px] font-semibold uppercase tracking-wider text-[var(--amber)]">${renderInline(line.replace(/^##\s+/, ''))}</h2>`) }
    else if (/^###\s+/.test(line))  { closeLists(); out.push(`<h3 class="mt-3 mb-1 font-display text-[13px] font-semibold text-[var(--ink)]">${renderInline(line.replace(/^###\s+/, ''))}</h3>`) }
    else if (/^---+$/.test(line))   { closeLists(); out.push('<hr class="my-4 border-t border-[var(--border)]" />') }
    else if (line === '')            { closeLists(); out.push('<div class="h-2"></div>') }
    else                             { closeLists(); out.push(`<p class="leading-relaxed text-[var(--ink)]">${renderInline(line)}</p>`) }
  }
  closeLists()
  return out.join('')
}

function downloadBlob(base64: string, filename: string, mimeType: string) {
  const bytes = atob(base64)
  const arr   = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  const blob  = new Blob([arr], { type: mimeType })
  const url   = URL.createObjectURL(blob)
  const a     = document.createElement('a')
  a.href      = url
  a.download  = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function ResourceOutput({ response, topic, onSave, saved }: Props) {
  const [streamed, setStreamed]   = useState('')
  const [streaming, setStreaming] = useState(false)
  const [copied, setCopied]       = useState(false)

  useEffect(() => {
    if (response.type !== 'text') { setStreaming(false); return }
    setStreamed('')
    setStreaming(true)
    const stop = streamText(response.output, (s) => setStreamed(s), () => setStreaming(false), 6)
    return stop
  }, [response])

  const handleCopy = () => {
    if (response.type === 'text' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(response.output).catch(() => {})
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (response.type === 'image') {
    return (
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-[var(--ink3)]">Generated Image</div>
            <h3 className="font-serif text-[22px] italic text-[var(--ink)]">{topic}</h3>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          <img
            src={`data:${response.mimeType};base64,${response.output}`}
            alt={topic}
            className="max-h-[480px] max-w-full rounded-xl object-contain shadow-lg"
          />
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--border)] px-5 py-3">
          <button
            onClick={() => downloadBlob(response.output, `${topic.replace(/[^a-z0-9]/gi, '-')}.png`, response.mimeType)}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--amber)] px-4 py-2 text-[13px] font-semibold text-[#0e0f0d] transition-transform hover:scale-[1.02]"
          >
            Download PNG
          </button>
          <button onClick={onSave} className="rounded-full border border-[var(--border2)] px-4 py-2 text-[13px] text-[var(--ink2)] hover:text-[var(--ink)]">
            {saved ? 'Saved ✓' : 'Save to history'}
          </button>
        </div>
      </div>
    )
  }

  if (response.type === 'pptx') {
    return (
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-[var(--ink3)]">Presentation</div>
            <h3 className="font-serif text-[22px] italic text-[var(--ink)]">{topic}</h3>
          </div>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--border2)] bg-[var(--surface2)]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-[var(--ink)]">Your presentation is ready</p>
            <p className="mt-1 text-[12px] text-[var(--ink3)]">{response.filename}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--border)] px-5 py-3">
          <button
            onClick={() => downloadBlob(response.output, response.filename, 'application/vnd.openxmlformats-officedocument.presentationml.presentation')}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--amber)] px-4 py-2 text-[13px] font-semibold text-[#0e0f0d] transition-transform hover:scale-[1.02]"
          >
            Download .pptx
          </button>
          <button onClick={onSave} className="rounded-full border border-[var(--border2)] px-4 py-2 text-[13px] text-[var(--ink2)] hover:text-[var(--ink)]">
            {saved ? 'Saved ✓' : 'Save to history'}
          </button>
        </div>
      </div>
    )
  }

  // Text output
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
        <div className="min-w-0">
          <h3 className="truncate font-serif text-[22px] italic text-[var(--ink)]">{topic}</h3>
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
          dangerouslySetInnerHTML={{ __html: renderBlocks(streamed || response.output) }}
        />
      </div>
      <RefinementBar onRefine={() => {}} onCopy={handleCopy} onSave={onSave} copied={copied} saved={saved} />
    </div>
  )
}
