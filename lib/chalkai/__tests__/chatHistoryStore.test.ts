import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createChatThread,
  deleteChatThread,
  getChatThread,
  listChatThreads,
  saveChatThreadMessages,
} from '../chatHistoryStore'

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

describe('chatHistoryStore', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage())
    vi.setSystemTime(new Date('2026-05-01T10:00:00.000Z'))
  })

  it('creates and retrieves a chat thread', () => {
    const thread = createChatThread({
      messages: [
        { id: 'u-1', role: 'user', body: 'Plan a fractions lesson' },
        { id: 'a-1', role: 'assistant', body: 'Here is a plan.' },
      ],
    })

    expect(thread.id).toMatch(/^chat-/)
    expect(thread.title).toBe('Plan a fractions lesson')
    expect(thread.updatedAt).toBe('2026-05-01T10:00:00.000Z')
    expect(getChatThread(thread.id)).toEqual(thread)
  })

  it('lists newest updated chat first', () => {
    const older = createChatThread({ messages: [{ id: 'u-1', role: 'user', body: 'Older chat' }] })
    vi.setSystemTime(new Date('2026-05-01T11:00:00.000Z'))
    const newer = createChatThread({ messages: [{ id: 'u-2', role: 'user', body: 'Newer chat' }] })

    expect(listChatThreads().map((thread) => thread.id)).toEqual([newer.id, older.id])
  })

  it('updates messages and derives a readable title from the first user message', () => {
    const thread = createChatThread({ messages: [] })

    const updated = saveChatThreadMessages(thread.id, [
      { id: 'u-1', role: 'user', body: 'Create a really long chat title that should be trimmed because the sidebar is narrow' },
      { id: 'a-1', role: 'assistant', body: 'Done.' },
    ])

    expect(updated?.title).toMatch(/^Create a really long chat title/)
    expect(updated?.title).toHaveLength(48)
    expect(updated?.messages).toHaveLength(2)
  })

  it('deletes a chat thread by id', () => {
    const thread = createChatThread({ messages: [{ id: 'u-1', role: 'user', body: 'Delete me' }] })

    deleteChatThread(thread.id)

    expect(listChatThreads()).toHaveLength(0)
  })
})
