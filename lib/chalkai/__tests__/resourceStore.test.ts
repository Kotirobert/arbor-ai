import { describe, expect, it, vi } from 'vitest'
import {
  buildSavedResourceMemory,
  captureSavedResourceMemory,
  captureSavedResourceMemoryForCurrentUser,
  deleteResource,
  listResources,
  saveResource,
} from '../resourceStore'
import type { UserMemoryItem } from '../memoryStore'

type QueryResult<T> = { data: T; error: { message?: string } | null }

function createResourceClient(options: {
  userId?: string | null
  resourceRows?: Array<Record<string, unknown>>
  insertRow?: Record<string, unknown>
  deleteRow?: Record<string, unknown>
  error?: string
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
      delete: vi.fn((...args: unknown[]) => {
        record(table, 'delete', args)
        return query
      }),
      eq: vi.fn((...args: unknown[]) => {
        record(table, 'eq', args)
        return query
      }),
      order: vi.fn((...args: unknown[]) => {
        record(table, 'order', args)
        return Promise.resolve({
          data: options.resourceRows ?? [],
          error: options.error ? { message: options.error } : null,
        } satisfies QueryResult<Array<Record<string, unknown>>>)
      }),
      single: vi.fn(() => Promise.resolve({
        data: options.insertRow ?? options.deleteRow ?? null,
        error: options.error ? { message: options.error } : null,
      } satisfies QueryResult<Record<string, unknown> | null>)),
    }

    return query
  }

  return {
    calls,
    client: {
      auth: {
        getUser: vi.fn(async () => ({
          data: { user: options.userId === null ? null : { id: options.userId ?? 'user-1' } },
          error: null,
        })),
      },
      from: vi.fn((table: string) => createQuery(table)),
    },
  }
}

const savedResourceRow = {
  id: 'res-1',
  type: 'text',
  resource_type: 'lesson_plan',
  title: 'Fractions Y4',
  output: 'content',
  created_at: '2026-01-01T00:00:00.000Z',
}

describe('resourceStore', () => {
  it('saves a resource through Supabase for the authenticated user', async () => {
    const { client, calls } = createResourceClient({ userId: 'user-1', insertRow: savedResourceRow })

    const result = await saveResource({
      type: 'text',
      resourceType: 'lesson_plan',
      title: 'Fractions Y4',
      output: 'content',
      createdAt: '2026-01-01T00:00:00.000Z',
    }, { supabase: client })

    expect(result.error).toBeNull()
    expect(result.data).toEqual({
      id: 'res-1',
      type: 'text',
      resourceType: 'lesson_plan',
      title: 'Fractions Y4',
      output: 'content',
      createdAt: '2026-01-01T00:00:00.000Z',
    })
    expect(calls.find((call) => call.method === 'insert')).toEqual({
      table: 'saved_resources',
      method: 'insert',
      args: [expect.objectContaining({
        user_id: 'user-1',
        resource_type: 'lesson_plan',
        created_at: '2026-01-01T00:00:00.000Z',
      })],
    })
  })

  it('lists saved resources from Supabase newest first', async () => {
    const { client, calls } = createResourceClient({ resourceRows: [savedResourceRow] })

    const result = await listResources({ supabase: client })

    expect(result.error).toBeNull()
    expect(result.data.map((resource) => resource.id)).toEqual(['res-1'])
    expect(calls).toContainEqual({
      table: 'saved_resources',
      method: 'order',
      args: ['created_at', { ascending: false }],
    })
  })

  it('deletes a resource by id through Supabase', async () => {
    const { client, calls } = createResourceClient({ deleteRow: { id: 'res-1' } })

    const result = await deleteResource('res-1', { supabase: client })

    expect(result.error).toBeNull()
    expect(result.data).toEqual({ deleted: true })
    expect(calls.find((call) => call.method === 'delete')).toEqual({
      table: 'saved_resources',
      method: 'delete',
      args: [],
    })
    expect(calls).toContainEqual({ table: 'saved_resources', method: 'eq', args: ['id', 'res-1'] })
  })

  it('builds safe metadata memory without storing generated content', () => {
    const memory = buildSavedResourceMemory({
      type: 'text',
      resourceType: 'worksheet',
      title: 'Fractions worksheet',
      output: 'FULL GENERATED RESOURCE CONTENT THAT SHOULD NOT BE STORED',
      createdAt: '2026-01-01T00:00:00.000Z',
    }, {
      yearGroup: 'Year 4',
      subject: 'Maths',
      outputStyle: 'Concise',
    })

    expect(memory).toEqual({
      kind: 'resource_signal',
      key: 'saved_resource:worksheet:year-4:maths',
      source: 'saved_resource',
      confidence: 0.7,
      value: {
        resourceType: 'worksheet',
        title: 'Fractions worksheet',
        yearGroup: 'Year 4',
        subject: 'Maths',
        outputStyle: 'Concise',
      },
    })
    expect(JSON.stringify(memory)).not.toContain('FULL GENERATED RESOURCE CONTENT')
  })

  it('replaces an active duplicate memory signal before saving a new one', async () => {
    const existingMemory: UserMemoryItem = {
      id: 'mem-1',
      userId: 'user-1',
      kind: 'resource_signal',
      key: 'saved_resource:worksheet:year-4:maths',
      value: { resourceType: 'worksheet' },
      source: 'saved_resource',
      confidence: 0.7,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      deletedAt: null,
    }
    const calls: string[] = []

    const result = await captureSavedResourceMemory('user-1', {
      type: 'text',
      resourceType: 'worksheet',
      title: 'Fractions worksheet',
      output: 'Generated content',
      createdAt: '2026-01-02T00:00:00.000Z',
    }, {
      yearGroup: 'Year 4',
      subject: 'Maths',
      outputStyle: 'Concise',
      listMemoryForUser: async () => {
        calls.push('list')
        return { data: [existingMemory], error: null }
      },
      deleteMemoryForUser: async (_userId, id) => {
        calls.push(`delete:${id}`)
        return { data: { deleted: true }, error: null }
      },
      saveMemoryForUser: async (_userId, item) => {
        calls.push(`save:${item.key}`)
        return { data: { ...existingMemory, id: 'mem-2', key: item.key, value: item.value }, error: null }
      },
    })

    expect(result.error).toBeNull()
    expect(result.data?.id).toBe('mem-2')
    expect(calls).toEqual(['list', 'delete:mem-1', 'save:saved_resource:worksheet:year-4:maths'])
  })

  it('captures saved-resource memory for the current authenticated user', async () => {
    const calls: string[] = []

    const result = await captureSavedResourceMemoryForCurrentUser({
      type: 'text',
      resourceType: 'quiz',
      title: 'Romans quiz',
      output: 'Generated content',
      createdAt: '2026-01-02T00:00:00.000Z',
    }, {
      yearGroup: 'Year 5',
      subject: 'History',
      outputStyle: 'Balanced',
      getUserId: async () => 'user-1',
      listMemoryForUser: async () => ({ data: [], error: null }),
      deleteMemoryForUser: async () => ({ data: { deleted: false }, error: null }),
      saveMemoryForUser: async (userId, item) => {
        calls.push(`${userId}:${item.key}`)
        return { data: null, error: null }
      },
    })

    expect(result.error).toBeNull()
    expect(calls).toEqual(['user-1:saved_resource:quiz:year-5:history'])
  })
})
