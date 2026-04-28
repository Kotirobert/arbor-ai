import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteResource, listResources, saveResource } from '../resourceStore'

function createMemoryStorage(): Storage {
  const entries = new Map<string, string>()

  return {
    get length() {
      return entries.size
    },
    clear: () => entries.clear(),
    getItem: (key: string) => entries.get(key) ?? null,
    key: (index: number) => Array.from(entries.keys())[index] ?? null,
    removeItem: (key: string) => {
      entries.delete(key)
    },
    setItem: (key: string, value: string) => {
      entries.set(key, value)
    },
  }
}

describe('resourceStore', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage())
  })

  it('saves and retrieves a resource', () => {
    const saved = saveResource({
      type: 'text',
      resourceType: 'lesson_plan',
      title: 'Fractions Y4',
      output: 'content',
      createdAt: '2026-01-01T00:00:00.000Z',
    })

    const resources = listResources()

    expect(resources).toHaveLength(1)
    expect(resources[0]).toEqual(saved)
    expect(resources[0].id).toMatch(/^res-/)
  })

  it('lists newest saved resource first', () => {
    const first = saveResource({
      type: 'text',
      resourceType: 'quiz',
      title: 'Quiz',
      output: 'q',
      createdAt: '2026-01-01T00:00:00.000Z',
    })
    const second = saveResource({
      type: 'image',
      resourceType: 'image',
      title: 'Diagram',
      output: 'data:image/png;base64,abc',
      createdAt: '2026-01-02T00:00:00.000Z',
    })

    expect(listResources().map((resource) => resource.id)).toEqual([second.id, first.id])
  })

  it('deletes a resource by id', () => {
    const { id } = saveResource({
      type: 'text',
      resourceType: 'quiz',
      title: 'Quiz',
      output: 'q',
      createdAt: '2026-01-01T00:00:00.000Z',
    })

    deleteResource(id)

    expect(listResources()).toHaveLength(0)
  })
})
