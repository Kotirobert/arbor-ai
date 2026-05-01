import { describe, expect, it, vi } from 'vitest'

import {
  deleteMemory,
  listMemory,
  saveMemory,
  summariseMemory,
  type MemoryStoreClient,
} from '../memoryStore'

type QueryResult<T> = { data: T; error: { message?: string } | null }

function createMemoryClient(options: {
  memoryRows?: Array<Record<string, unknown>>
  summaryRows?: Array<Record<string, unknown>>
  insertRow?: Record<string, unknown>
  updateRow?: Record<string, unknown>
  insertError?: string
  updateError?: string
} = {}) {
  const calls: Array<{ table: string; method: string; args: unknown[] }> = []

  function record(table: string, method: string, args: unknown[]) {
    calls.push({ table, method, args })
  }

  function createQuery(table: string) {
    const query = {
      select: vi.fn((...args: unknown[]) => {
        record(table, 'select', args)
        return query
      }),
      insert: vi.fn((...args: unknown[]) => {
        record(table, 'insert', args)
        return query
      }),
      update: vi.fn((...args: unknown[]) => {
        record(table, 'update', args)
        return query
      }),
      eq: vi.fn((...args: unknown[]) => {
        record(table, 'eq', args)
        return query
      }),
      is: vi.fn((...args: unknown[]) => {
        record(table, 'is', args)
        return query
      }),
      order: vi.fn((...args: unknown[]) => {
        record(table, 'order', args)
        return Promise.resolve({
          data: table === 'memory_summaries'
            ? options.summaryRows ?? []
            : options.memoryRows ?? [],
          error: null,
        } satisfies QueryResult<Array<Record<string, unknown>>>)
      }),
      limit: vi.fn((...args: unknown[]) => {
        record(table, 'limit', args)
        return Promise.resolve({
          data: options.summaryRows ?? [],
          error: null,
        } satisfies QueryResult<Array<Record<string, unknown>>>)
      }),
      single: vi.fn(() => Promise.resolve({
        data: options.insertRow ?? options.updateRow ?? null,
        error: options.insertError || options.updateError
          ? { message: options.insertError ?? options.updateError }
          : null,
      } satisfies QueryResult<Record<string, unknown> | null>)),
    }

    return query
  }

  const client: MemoryStoreClient = {
    from: vi.fn((table: string) => createQuery(table)),
  }

  return { client, calls }
}

const memoryRow = {
  id: 'mem-1',
  user_id: 'user-1',
  kind: 'preference',
  key: 'output_style',
  value: { style: 'concise' },
  source: 'manual',
  confidence: 0.9,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-02T00:00:00.000Z',
  deleted_at: null,
}

describe('memoryStore', () => {
  it('lists active memory scoped to the requested user', async () => {
    const { client, calls } = createMemoryClient({ memoryRows: [memoryRow] })

    const result = await listMemory('user-1', { supabase: client })

    expect(result.error).toBeNull()
    expect(result.data).toEqual([
      expect.objectContaining({
        id: 'mem-1',
        userId: 'user-1',
        key: 'output_style',
        value: { style: 'concise' },
      }),
    ])
    expect(calls).toContainEqual({ table: 'user_memory_items', method: 'eq', args: ['user_id', 'user-1'] })
    expect(calls).toContainEqual({ table: 'user_memory_items', method: 'is', args: ['deleted_at', null] })
    expect(calls).toContainEqual({
      table: 'user_memory_items',
      method: 'order',
      args: ['updated_at', { ascending: false }],
    })
  })

  it('ignores malformed memory rows returned by Supabase', async () => {
    const { client } = createMemoryClient({
      memoryRows: [
        memoryRow,
        { ...memoryRow, id: null },
        { ...memoryRow, kind: 'not_a_kind' },
      ],
    })

    const result = await listMemory('user-1', { supabase: client })

    expect(result.error).toBeNull()
    expect(result.data).toHaveLength(1)
    expect(result.data[0].id).toBe('mem-1')
  })

  it('saves validated memory through Supabase', async () => {
    const { client, calls } = createMemoryClient({ insertRow: memoryRow })

    const result = await saveMemory('user-1', {
      kind: 'preference',
      key: 'output_style',
      value: { style: 'concise' },
      source: 'manual',
      confidence: 0.9,
    }, { supabase: client })

    expect(result.error).toBeNull()
    expect(result.data?.id).toBe('mem-1')
    expect(calls.find((call) => call.method === 'insert')).toEqual({
      table: 'user_memory_items',
      method: 'insert',
      args: [expect.objectContaining({
        user_id: 'user-1',
        kind: 'preference',
        key: 'output_style',
        source: 'manual',
      })],
    })
  })

  it('blocks severe PII before writing memory', async () => {
    const { client, calls } = createMemoryClient()

    const result = await saveMemory('user-1', {
      kind: 'manual_note',
      key: 'contact',
      value: { note: 'Email teacher@school.co.uk' },
      source: 'manual',
    }, { supabase: client })

    expect(result.data).toBeNull()
    expect(result.error).toContain('Blocked PII')
    expect(calls.some((call) => call.method === 'insert')).toBe(false)
  })

  it('soft-deletes memory scoped by id and user id', async () => {
    const { client, calls } = createMemoryClient({ updateRow: { id: 'mem-1' } })

    const result = await deleteMemory('user-1', 'mem-1', { supabase: client })

    expect(result.error).toBeNull()
    expect(result.data).toEqual({ deleted: true })
    expect(calls.find((call) => call.method === 'update')).toEqual({
      table: 'user_memory_items',
      method: 'update',
      args: [expect.objectContaining({ deleted_at: expect.any(String) })],
    })
    expect(calls).toContainEqual({ table: 'user_memory_items', method: 'eq', args: ['id', 'mem-1'] })
    expect(calls).toContainEqual({ table: 'user_memory_items', method: 'eq', args: ['user_id', 'user-1'] })
  })

  it('returns compact prompt-ready summary memory when available', async () => {
    const { client } = createMemoryClient({
      summaryRows: [{
        summary: 'Prefers concise Year 4 maths resources.',
        updated_at: '2026-01-03T00:00:00.000Z',
      }],
    })

    const result = await summariseMemory('user-1', { supabase: client })

    expect(result.error).toBeNull()
    expect(result.data.text).toBe('Prefers concise Year 4 maths resources.')
    expect(result.data.source).toBe('summary')
  })

  it('falls back to active memory items when no summary exists', async () => {
    const { client } = createMemoryClient({ memoryRows: [memoryRow], summaryRows: [] })

    const result = await summariseMemory('user-1', { supabase: client })

    expect(result.error).toBeNull()
    expect(result.data.source).toBe('items')
    expect(result.data.text).toContain('preference: output_style')
    expect(result.data.text).toContain('concise')
  })

  it('returns a clear non-crashing fallback when Supabase is unavailable', async () => {
    const result = await listMemory('user-1', {
      createClient: () => {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
      },
    })

    expect(result.data).toEqual([])
    expect(result.error).toContain('Missing NEXT_PUBLIC_SUPABASE_URL')
  })
})
