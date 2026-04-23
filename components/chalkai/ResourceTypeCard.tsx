'use client'

import { cn } from '@/lib/utils'
import type { ResourceTypeMeta } from '@/lib/chalkai/resourceTemplates'

interface Props {
  meta:     ResourceTypeMeta
  selected: boolean
  onClick:  () => void
}

function Icon({ name }: { name: string }) {
  const common = 'h-5 w-5'
  switch (name) {
    case 'lesson':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 5h12a2 2 0 012 2v12a2 2 0 01-2 2H4z" />
          <path d="M4 5a2 2 0 00-2 2v12" />
          <path d="M7 9h7M7 13h7M7 17h4" />
        </svg>
      )
    case 'worksheet':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      )
    case 'quiz':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9.5a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 3.5" />
          <path d="M12 17h.01" />
        </svg>
      )
    case 'email':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 7l9 6 9-6" />
        </svg>
      )
    default:
      return null
  }
}

export function ResourceTypeCard({ meta, selected, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-200',
        selected
          ? 'border-[var(--amber-border)] bg-[var(--surface2)] shadow-[0_0_0_1px_var(--amber-border),0_8px_32px_rgba(232,163,42,0.12)]'
          : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border2)]',
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-colors',
          selected ? '' : 'bg-[var(--surface2)]',
        )}
        style={
          selected
            ? { background: `color-mix(in srgb, var(${meta.cssVar}) 18%, var(--surface2))`, color: `var(${meta.cssVar})` }
            : { color: `var(${meta.cssVar})` }
        }
      >
        <Icon name={meta.icon} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-display text-[14px] font-medium text-[var(--ink)]">{meta.title}</span>
          {selected && (
            <span className="inline-flex h-1.5 w-1.5 rounded-full" style={{ background: `var(${meta.cssVar})` }} />
          )}
        </div>
        <div className="mt-0.5 text-[11.5px] text-[var(--ink3)]">{meta.subtitle}</div>
      </div>
    </button>
  )
}
