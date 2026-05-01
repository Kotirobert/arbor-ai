import type { GenerateResponse } from '@/types'

const STORAGE_KEY = 'chalkai-chat-history'
const MAX_THREADS = 30
const TITLE_LIMIT = 48

export interface ChatHistoryMessage {
  id: string
  role: 'user' | 'assistant'
  title?: string
  body: string
  streaming?: boolean
  options?: string[]
  resource?: GenerateResponse & { type: 'image' | 'pptx' }
  resourceTopic?: string
}

export interface ChatThread {
  id: string
  title: string
  messages: ChatHistoryMessage[]
  createdAt: string
  updatedAt: string
}

interface CreateChatThreadInput {
  messages: ChatHistoryMessage[]
}

function storage(): Storage | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `chat-${crypto.randomUUID()}`
  }
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function now(): string {
  return new Date().toISOString()
}

function load(): ChatThread[] {
  const store = storage()
  if (!store) return []

  try {
    const parsed = JSON.parse(store.getItem(STORAGE_KEY) ?? '[]') as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isChatThread)
  } catch {
    return []
  }
}

function persist(threads: ChatThread[]): void {
  const store = storage()
  if (!store) return
  store.setItem(STORAGE_KEY, JSON.stringify(threads.slice(0, MAX_THREADS)))
}

function isChatThread(value: unknown): value is ChatThread {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<ChatThread>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    Array.isArray(candidate.messages) &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.updatedAt === 'string'
  )
}

function titleFor(messages: ChatHistoryMessage[]): string {
  const firstUserMessage = messages.find((message) => message.role === 'user' && message.body.trim())
  const raw = firstUserMessage?.body.trim().replace(/\s+/g, ' ') ?? ''
  if (!raw) return 'New chat'
  if (raw.length <= TITLE_LIMIT) return raw
  return `${raw.slice(0, TITLE_LIMIT - 3)}...`
}

function normaliseMessages(messages: ChatHistoryMessage[]): ChatHistoryMessage[] {
  return messages.map((message) => ({ ...message, streaming: false }))
}

export function createChatThread(input: CreateChatThreadInput): ChatThread {
  const timestamp = now()
  const thread: ChatThread = {
    id: createId(),
    title: titleFor(input.messages),
    messages: normaliseMessages(input.messages),
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  persist([thread, ...load()])
  return thread
}

export function listChatThreads(): ChatThread[] {
  return load().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function getChatThread(id: string): ChatThread | null {
  return load().find((thread) => thread.id === id) ?? null
}

export function saveChatThreadMessages(id: string, messages: ChatHistoryMessage[]): ChatThread | null {
  const threads = load()
  const existing = threads.find((thread) => thread.id === id)
  if (!existing) return null

  const updated: ChatThread = {
    ...existing,
    title: titleFor(messages),
    messages: normaliseMessages(messages),
    updatedAt: now(),
  }
  persist([updated, ...threads.filter((thread) => thread.id !== id)])
  return updated
}

export function deleteChatThread(id: string): void {
  persist(load().filter((thread) => thread.id !== id))
}
