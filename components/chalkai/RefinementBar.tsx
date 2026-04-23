'use client'

import { cn } from '@/lib/utils'

interface Props {
  onRefine: (action: string) => void
  onCopy:   () => void
  onSave:   () => void
  copied?:  boolean
  saved?:   boolean
}

const REFINE_ACTIONS = [
  { id: 'shorter',       label: 'Make it shorter' },
  { id: 'scaffolding',   label: 'Add more scaffolding' },
  { id: 'plain-english', label: 'Rewrite in plain English' },
  { id: 'challenge',     label: 'Add a challenge task' },
]

export function RefinementBar({ onRefine, onCopy, onSave, copied, saved }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] bg-[var(--surface)] px-4 py-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[10.5px] uppercase tracking-wider text-[var(--ink3)]">Refine</span>
        {REFINE_ACTIONS.map((a) => (
          <button
            key={a.id}
            onClick={() => onRefine(a.id)}
            className="rounded-full border border-[var(--border)] bg-[var(--surface2)] px-3 py-1 text-[11.5px] text-[var(--ink2)] transition-colors hover:border-[var(--amber-border)] hover:text-[var(--ink)]"
          >
            {a.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onCopy}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11.5px] transition-colors',
            copied
              ? 'border-[var(--green-border)] bg-[var(--green-dim)] text-[var(--green)]'
              : 'border-[var(--border)] bg-[var(--surface2)] text-[var(--ink2)] hover:text-[var(--ink)]',
          )}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15V5a2 2 0 012-2h10" />
          </svg>
          {copied ? 'Copied' : 'Copy'}
        </button>

        <button
          onClick={onSave}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-medium transition-all',
            saved
              ? 'bg-[var(--green-dim)] text-[var(--green)]'
              : 'bg-[var(--amber)] text-[#0e0f0d] hover:scale-[1.02]',
          )}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
          </svg>
          {saved ? 'Saved to history' : 'Save to history'}
        </button>
      </div>
    </div>
  )
}
