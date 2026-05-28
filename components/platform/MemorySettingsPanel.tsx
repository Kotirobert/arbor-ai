'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  clearMemory,
  deleteMemory,
  listMemory,
  type MemoryKind,
  type UserMemoryItem,
} from '@/lib/chalkai/memoryStore'
import { createClient } from '@/lib/supabase/client'

const MEMORY_KIND_LABELS: Record<MemoryKind, string> = {
  preference: 'Preferences',
  class_context: 'Class context',
  resource_signal: 'Resource signals',
  chat_summary: 'Chat summaries',
  manual_note: 'Manual notes',
}

const MEMORY_KIND_HELP: Record<MemoryKind, string> = {
  preference: 'Durable choices such as output style, lesson structure, and recurring preferences.',
  class_context: 'Useful class-level context, never pupil-identifiable records.',
  resource_signal: 'Lightweight signals from resources you save or generate.',
  chat_summary: 'Concise summaries that help ChalkAI keep continuity between sessions.',
  manual_note: 'Notes you explicitly choose to store for future replies.',
}

interface MemorySettingsPanelProps {
  initialMemory?: UserMemoryItem[]
  initialUserId?: string | null
  listMemoryForUser?: typeof listMemory
  deleteMemoryForUser?: typeof deleteMemory
  clearMemoryForUser?: typeof clearMemory
}

type MemoryStatus = 'loading' | 'ready' | 'unavailable'

export function groupMemoryByKind(items: UserMemoryItem[]): Array<{
  kind: MemoryKind
  label: string
  helper: string
  items: UserMemoryItem[]
}> {
  return (Object.keys(MEMORY_KIND_LABELS) as MemoryKind[])
    .map((kind) => ({
      kind,
      label: MEMORY_KIND_LABELS[kind],
      helper: MEMORY_KIND_HELP[kind],
      items: items.filter((item) => item.kind === kind),
    }))
    .filter((group) => group.items.length > 0)
}

export function formatMemoryValue(value: Record<string, unknown>): string {
  return Object.values(value)
    .map((entry) => {
      if (typeof entry === 'string') return entry
      if (typeof entry === 'number' || typeof entry === 'boolean') return String(entry)
      if (Array.isArray(entry)) return entry.filter((item) => typeof item === 'string').join(', ')
      return ''
    })
    .filter(Boolean)
    .join('; ')
}

async function getCurrentUserId(): Promise<string | null> {
  const supabase = createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error) return null
  return data.user?.id ?? null
}

export function MemorySettingsPanel({
  initialMemory,
  initialUserId = null,
  listMemoryForUser = listMemory,
  deleteMemoryForUser = deleteMemory,
  clearMemoryForUser = clearMemory,
}: MemorySettingsPanelProps) {
  const [userId, setUserId] = useState<string | null>(initialUserId)
  const [items, setItems] = useState<UserMemoryItem[]>(initialMemory ?? [])
  const [status, setStatus] = useState<MemoryStatus>(initialMemory ? 'ready' : 'loading')
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const groups = useMemo(() => groupMemoryByKind(items), [items])

  useEffect(() => {
    if (initialMemory) return

    let cancelled = false

    async function load() {
      try {
        const nextUserId = initialUserId ?? await getCurrentUserId()
        if (!nextUserId) {
          if (!cancelled) setStatus('unavailable')
          return
        }

        const result = await listMemoryForUser(nextUserId)
        if (cancelled) return

        setUserId(nextUserId)
        setItems(result.data)
        setError(result.error)
        setStatus(result.error ? 'unavailable' : 'ready')
      } catch (loadError) {
        if (cancelled) return
        setError(loadError instanceof Error ? loadError.message : 'Memory controls are unavailable')
        setStatus('unavailable')
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [initialMemory, initialUserId, listMemoryForUser])

  async function removeItem(id: string) {
    if (!userId) return
    setBusyId(id)
    setError(null)

    const result = await deleteMemoryForUser(userId, id)
    if (result.error) {
      setError(result.error)
    } else {
      setItems((current) => current.filter((item) => item.id !== id))
    }

    setBusyId(null)
  }

  async function clearAll() {
    if (!userId) return
    setBusyId('clear-all')
    setError(null)

    const result = await clearMemoryForUser(userId)
    if (result.error) {
      setError(result.error)
    } else {
      setItems([])
    }

    setBusyId(null)
  }

  return (
    <section
      aria-labelledby="memory-settings-title"
      style={{ borderTop: '1px solid var(--line)', paddingTop: 32, marginTop: 8, marginBottom: 40 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          <h2 id="memory-settings-title" className="side-group__title" style={{ marginBottom: 8 }}>
            Memory controls
          </h2>
          <p style={{ margin: 0, color: 'var(--ink-2)', fontSize: 13, lineHeight: 1.55, maxWidth: 520 }}>
            ChalkAI stores small, private notes about preferences, class context, and saved-resource signals.
            It should not store pupil-identifiable details or full generated resources.
          </p>
        </div>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={clearAll}
          disabled={!userId || items.length === 0 || Boolean(busyId)}
          style={{ color: 'var(--red)', borderColor: 'var(--line-2)' }}
        >
          {busyId === 'clear-all' ? 'Clearing...' : 'Clear all memory'}
        </button>
      </div>

      {status === 'loading' && (
        <p style={{ color: 'var(--ink-3)', fontSize: 13, margin: 0 }}>Checking memory...</p>
      )}

      {status === 'unavailable' && (
        <div style={{ border: '1px solid var(--line-2)', borderRadius: 8, padding: 14, background: 'var(--paper-2)' }}>
          <p style={{ color: 'var(--ink-2)', fontSize: 13, margin: 0 }}>
            Memory controls will appear once Supabase auth is available for this session.
          </p>
          {error && <p style={{ color: 'var(--red)', fontSize: 12, margin: '8px 0 0' }}>{error}</p>}
        </div>
      )}

      {status === 'ready' && items.length === 0 && (
        <div style={{ border: '1px solid var(--line-2)', borderRadius: 8, padding: 14, background: 'var(--paper-2)' }}>
          <p style={{ color: 'var(--ink-2)', fontSize: 13, margin: 0 }}>
            No memory has been saved yet. ChalkAI will only use memory after you save resources or add preferences.
          </p>
        </div>
      )}

      {status === 'ready' && groups.length > 0 && (
        <div style={{ display: 'grid', gap: 14 }}>
          {groups.map((group) => (
            <div key={group.kind} style={{ border: '1px solid var(--line)', borderRadius: 8, background: 'var(--paper)', padding: 16 }}>
              <div style={{ marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, margin: 0, fontWeight: 600 }}>{group.label}</h3>
                <p style={{ color: 'var(--ink-3)', fontSize: 12, lineHeight: 1.45, margin: '4px 0 0' }}>
                  {group.helper}
                </p>
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0, 1fr) auto',
                      gap: 12,
                      alignItems: 'center',
                      border: '1px solid var(--line-2)',
                      borderRadius: 8,
                      padding: 12,
                      background: 'var(--paper-2)',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{item.key}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 3, overflowWrap: 'anywhere' }}>
                        {formatMemoryValue(item.value) || 'Stored structured preference'}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                        <span className="tag">{item.source}</span>
                        <span style={{ fontSize: 11, color: 'var(--ink-3)', alignSelf: 'center' }}>
                          Updated {new Date(item.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => void removeItem(item.id)}
                      disabled={Boolean(busyId)}
                      style={{ color: 'var(--red)' }}
                    >
                      {busyId === item.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && status === 'ready' && (
        <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 12 }}>{error}</p>
      )}
    </section>
  )
}
