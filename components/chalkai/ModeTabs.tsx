'use client'

import { cn } from '@/lib/utils'

export type ChalkAiMode = 'assistant' | 'generator'

interface Props {
  value:    ChalkAiMode
  onChange: (m: ChalkAiMode) => void
}

const TABS: { id: ChalkAiMode; label: string; subtitle: string }[] = [
  { id: 'assistant', label: 'Assistant', subtitle: 'Chat, slash commands, quick drafts' },
  { id: 'generator', label: 'Generator', subtitle: 'Structured output for 4 resource types' },
]

export function ModeTabs({ value, onChange }: Props) {
  return (
    <div className="inline-flex items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-1">
      {TABS.map((t) => {
        const active = t.id === value
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={cn(
              'group relative rounded-xl px-4 py-2 text-left transition-colors',
              active ? 'bg-[var(--surface2)]' : 'hover:bg-[var(--surface2)]/60',
            )}
          >
            <div className={cn(
              'text-[13px] font-medium',
              active ? 'text-[var(--amber)]' : 'text-[var(--ink2)] group-hover:text-[var(--ink)]',
            )}>
              {t.label}
            </div>
            <div className="text-[10.5px] text-[var(--ink3)]">{t.subtitle}</div>
          </button>
        )
      })}
    </div>
  )
}
