'use client'

import { useEffect, useMemo, useRef } from 'react'
import { SLASH_COMMANDS } from '@/lib/chalkai/slashCommands'
import { cn } from '@/lib/utils'

interface Props {
  query:    string // current input value
  active:   number
  onPick:   (cmd: string) => void
  onMove:   (delta: number) => void
}

export function SlashCommandHint({ query, active, onPick, onMove }: Props) {
  const filtered = useMemo(() => {
    if (!query.startsWith('/')) return []
    const q = query.slice(1).toLowerCase()
    return SLASH_COMMANDS.filter((c) =>
      c.cmd.slice(1).toLowerCase().startsWith(q) || c.label.toLowerCase().includes(q),
    )
  }, [query])

  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [active])

  if (filtered.length === 0) return null

  return (
    <div
      ref={listRef}
      className="absolute bottom-full left-0 right-0 mb-2 max-h-64 overflow-y-auto rounded-xl border border-[var(--border2)] bg-[var(--surface2)] p-1 shadow-[0_12px_40px_rgba(0,0,0,0.55)]"
      onMouseDown={(e) => e.preventDefault()}
    >
      {filtered.map((c, i) => {
        const isActive = i === active % filtered.length
        return (
          <button
            key={c.cmd}
            data-idx={i}
            type="button"
            onClick={() => onPick(c.cmd + ' ')}
            onMouseEnter={() => onMove(i - active)}
            className={cn(
              'flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors',
              isActive
                ? 'bg-[var(--amber-dim)] ring-1 ring-[var(--amber-border)]'
                : 'hover:bg-[var(--surface3)]',
            )}
          >
            <span className={cn('mt-0.5 font-mono text-[11px]', isActive ? 'text-[var(--amber)]' : 'text-[var(--ink2)]')}>
              {c.cmd}
            </span>
            <span className="flex-1">
              <span className="block text-[13px] text-[var(--ink)]">{c.label}</span>
              <span className="block text-[11px] text-[var(--ink3)]">{c.description}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
