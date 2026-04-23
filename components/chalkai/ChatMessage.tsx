'use client'

import { cn } from '@/lib/utils'

export interface ChatBubble {
  id:        string
  role:      'user' | 'assistant'
  title?:    string
  body:      string
  streaming?: boolean
  options?:  string[]
  onOptionClick?: (opt: string) => void
}

// Very lightweight inline markdown: **bold**, *italic*, `code`, and preserve line breaks.
function renderInline(md: string): string {
  return md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|\s)_(.+?)_(?=\s|$)/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code class="rounded bg-[var(--surface3)] px-1.5 py-0.5 text-[0.85em]">$1</code>')
}

function renderBlocks(md: string): string {
  const lines = md.split('\n')
  const out:   string[] = []
  let inUl  = false
  let inOl  = false
  let inBq  = false

  const closeLists = () => {
    if (inUl) { out.push('</ul>'); inUl = false }
    if (inOl) { out.push('</ol>'); inOl = false }
  }
  const closeBq = () => {
    if (inBq) { out.push('</blockquote>'); inBq = false }
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    if (/^[-*]\s+/.test(line)) {
      closeBq()
      if (!inUl) { closeLists(); out.push('<ul class="my-2 list-disc space-y-1 pl-5">'); inUl = true }
      out.push(`<li>${renderInline(line.replace(/^[-*]\s+/, ''))}</li>`)
    } else if (/^\d+\.\s+/.test(line)) {
      closeBq()
      if (!inOl) { closeLists(); out.push('<ol class="my-2 list-decimal space-y-1 pl-5">'); inOl = true }
      out.push(`<li>${renderInline(line.replace(/^\d+\.\s+/, ''))}</li>`)
    } else if (/^>\s?/.test(line)) {
      closeLists()
      if (!inBq) { out.push('<blockquote class="my-2 border-l-2 border-[var(--amber-border)] pl-3 text-[var(--ink2)]">'); inBq = true }
      out.push(`<p>${renderInline(line.replace(/^>\s?/, ''))}</p>`)
    } else if (/^#{1,3}\s+/.test(line)) {
      closeLists(); closeBq()
      const level = line.match(/^(#{1,3})/)?.[1].length ?? 2
      const text  = line.replace(/^#{1,3}\s+/, '')
      const sizes = { 1: 'text-lg', 2: 'text-base', 3: 'text-sm' }[level as 1 | 2 | 3]
      out.push(`<p class="mt-3 mb-1 font-display font-semibold ${sizes} text-[var(--ink)]">${renderInline(text)}</p>`)
    } else if (line === '') {
      closeLists(); closeBq()
      out.push('<div class="h-2"></div>')
    } else {
      closeLists(); closeBq()
      out.push(`<p>${renderInline(line)}</p>`)
    }
  }
  closeLists(); closeBq()
  return out.join('')
}

export function ChatMessage({ role, title, body, streaming, options, onOptionClick }: ChatBubble) {
  const isUser = role === 'user'

  return (
    <div className={cn('flex w-full gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#e8a32a,#c9801a)]">
          <span className="font-display text-[10px] font-bold text-[#0e0f0d]">C</span>
        </div>
      )}

      <div
        className={cn(
          'max-w-[78%] rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed',
          isUser
            ? 'rounded-br-sm bg-[var(--surface2)] text-[var(--ink)]'
            : 'rounded-bl-sm border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]',
        )}
      >
        {title && (
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-[var(--amber)]">
            <span className="inline-block h-1 w-1 rounded-full bg-[var(--amber)]" />
            {title}
          </div>
        )}

        <div
          className={cn('prose-sm space-y-1', streaming && 'caret')}
          dangerouslySetInnerHTML={{ __html: renderBlocks(body) }}
        />

        {options && options.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => onOptionClick?.(opt)}
                className="rounded-full border border-[var(--border2)] bg-[var(--surface2)] px-3 py-1 text-xs text-[var(--ink2)] transition-colors hover:border-[var(--amber-border)] hover:text-[var(--ink)]"
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>

      {isUser && (
        <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-[var(--border2)] bg-[var(--surface2)]">
          <span className="text-[11px] font-medium text-[var(--ink2)]">You</span>
        </div>
      )}
    </div>
  )
}
