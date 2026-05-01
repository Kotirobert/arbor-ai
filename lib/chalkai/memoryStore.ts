import { createClient } from '@/lib/supabase/client'
import { scanForPII } from './piiScanner'

export type MemoryKind = 'preference' | 'class_context' | 'resource_signal' | 'chat_summary' | 'manual_note'
export type MemorySource = 'profile' | 'generator' | 'saved_resource' | 'chat' | 'manual'
export type SummaryKind = 'teacher_memory' | 'class_context' | 'resource_preferences' | 'chat_summary'

export interface UserMemoryItem {
  id: string
  userId: string
  kind: MemoryKind
  key: string
  value: Record<string, unknown>
  source: MemorySource
  confidence: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface NewMemoryItem {
  kind: MemoryKind
  key: string
  value: Record<string, unknown>
  source: MemorySource
  confidence?: number
}

export interface MemoryPromptSummary {
  text: string
  source: 'summary' | 'items' | 'empty'
  itemCount: number
}

export interface MemoryStoreResult<T> {
  data: T
  error: string | null
}

type SupabaseError = { message?: string } | null
type SupabaseQueryResult<T> = Promise<{ data: T; error: SupabaseError }>
type SupabaseMaybeSingleResult<T> = Promise<{ data: T | null; error: SupabaseError }>

type QueryBuilder<T> = {
  select: (columns?: string) => QueryBuilder<T>
  insert: (values: Record<string, unknown>) => QueryBuilder<T>
  update: (values: Record<string, unknown>) => QueryBuilder<T>
  eq: (column: string, value: unknown) => QueryBuilder<T>
  is: (column: string, value: unknown) => QueryBuilder<T>
  order: (column: string, options?: { ascending?: boolean }) => SupabaseQueryResult<T[]>
  single: () => SupabaseMaybeSingleResult<T>
}

export type MemoryStoreClient = {
  from: (table: string) => QueryBuilder<Record<string, unknown>>
}

export interface MemoryStoreOptions {
  supabase?: MemoryStoreClient
  createClient?: () => MemoryStoreClient
  now?: () => string
}

type ClientResult =
  | { client: MemoryStoreClient; error: null }
  | { client?: never; error: string }

const MEMORY_KINDS = new Set<MemoryKind>([
  'preference',
  'class_context',
  'resource_signal',
  'chat_summary',
  'manual_note',
])

const MEMORY_SOURCES = new Set<MemorySource>([
  'profile',
  'generator',
  'saved_resource',
  'chat',
  'manual',
])

const SUMMARY_BUDGET = 1200

export async function listMemory(
  userId: string,
  options: MemoryStoreOptions = {},
): Promise<MemoryStoreResult<UserMemoryItem[]>> {
  const clientResult = getClient(options)
  if (clientResult.error !== null) return { data: [], error: clientResult.error }

  try {
    const { data, error } = await clientResult.client
      .from('user_memory_items')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })

    if (error) return { data: [], error: normaliseError(error) }

    return {
      data: (data ?? []).map(mapMemoryRow).filter((item): item is UserMemoryItem => Boolean(item)),
      error: null,
    }
  } catch (error) {
    return { data: [], error: normaliseError(error) }
  }
}

export async function saveMemory(
  userId: string,
  item: NewMemoryItem,
  options: MemoryStoreOptions = {},
): Promise<MemoryStoreResult<UserMemoryItem | null>> {
  const validationError = validateMemoryInput(userId, item)
  if (validationError) return { data: null, error: validationError }

  const piiText = `${item.key}\n${JSON.stringify(item.value)}`
  const pii = scanForPII(piiText)
  if (pii.blocked) {
    const types = [...new Set(pii.findings.filter((finding) => finding.severity === 'block').map((finding) => finding.type))]
    return { data: null, error: `Blocked PII in memory item: ${types.join(', ')}` }
  }

  const clientResult = getClient(options)
  if (clientResult.error !== null) return { data: null, error: clientResult.error }

  try {
    const { data, error } = await clientResult.client
      .from('user_memory_items')
      .insert({
        user_id: userId,
        kind: item.kind,
        key: item.key.trim(),
        value: item.value,
        source: item.source,
        confidence: item.confidence ?? 1,
      })
      .select('*')
      .single()

    if (error) return { data: null, error: normaliseError(error) }

    const mapped = mapMemoryRow(data)
    return mapped ? { data: mapped, error: null } : { data: null, error: 'Memory row was malformed' }
  } catch (error) {
    return { data: null, error: normaliseError(error) }
  }
}

export async function deleteMemory(
  userId: string,
  id: string,
  options: MemoryStoreOptions = {},
): Promise<MemoryStoreResult<{ deleted: boolean }>> {
  const clientResult = getClient(options)
  if (clientResult.error !== null) return { data: { deleted: false }, error: clientResult.error }

  try {
    const { data, error } = await clientResult.client
      .from('user_memory_items')
      .update({ deleted_at: options.now?.() ?? new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select('id')
      .single()

    if (error) return { data: { deleted: false }, error: normaliseError(error) }

    return { data: { deleted: Boolean(data) }, error: null }
  } catch (error) {
    return { data: { deleted: false }, error: normaliseError(error) }
  }
}

export async function summariseMemory(
  userId: string,
  options: MemoryStoreOptions = {},
): Promise<MemoryStoreResult<MemoryPromptSummary>> {
  const empty: MemoryPromptSummary = { text: '', source: 'empty', itemCount: 0 }
  const clientResult = getClient(options)
  if (clientResult.error !== null) return { data: empty, error: clientResult.error }

  try {
    const summaryResult = await clientResult.client
      .from('memory_summaries')
      .select('summary, updated_at')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })

    if (summaryResult.error) return { data: empty, error: normaliseError(summaryResult.error) }

    const summary = summaryResult.data?.find((row) => typeof row.summary === 'string' && row.summary.trim())
    if (summary && typeof summary.summary === 'string') {
      const text = boundText(summary.summary)
      return { data: { text, source: 'summary', itemCount: 1 }, error: null }
    }

    const memory = await listMemory(userId, { ...options, supabase: clientResult.client })
    if (memory.error) return { data: empty, error: memory.error }
    if (!memory.data.length) return { data: empty, error: null }

    const text = boundText(memory.data.map(formatMemoryItem).filter(Boolean).join('\n'))
    return { data: { text, source: 'items', itemCount: memory.data.length }, error: null }
  } catch (error) {
    return { data: empty, error: normaliseError(error) }
  }
}

function getClient(options: MemoryStoreOptions): ClientResult {
  try {
    return {
      client: options.supabase ?? options.createClient?.() ?? createClient() as unknown as MemoryStoreClient,
      error: null,
    }
  } catch (error) {
    return { error: normaliseError(error) }
  }
}

function validateMemoryInput(userId: string, item: NewMemoryItem): string | null {
  if (!userId.trim()) return 'Memory userId is required'
  if (!MEMORY_KINDS.has(item.kind)) return 'Memory kind is invalid'
  if (!item.key.trim()) return 'Memory key is required'
  if (!item.value || typeof item.value !== 'object' || Array.isArray(item.value)) return 'Memory value must be an object'
  if (!MEMORY_SOURCES.has(item.source)) return 'Memory source is invalid'
  if (item.confidence !== undefined && (item.confidence < 0 || item.confidence > 1)) {
    return 'Memory confidence must be between 0 and 1'
  }
  return null
}

function mapMemoryRow(row: Record<string, unknown> | null): UserMemoryItem | null {
  if (!row) return null
  if (typeof row.id !== 'string') return null
  if (typeof row.user_id !== 'string') return null
  if (!isMemoryKind(row.kind)) return null
  if (typeof row.key !== 'string') return null
  if (!isRecord(row.value)) return null
  if (!isMemorySource(row.source)) return null
  if (typeof row.confidence !== 'number') return null
  if (typeof row.created_at !== 'string') return null
  if (typeof row.updated_at !== 'string') return null
  if (row.deleted_at !== null && typeof row.deleted_at !== 'string') return null

  return {
    id: row.id,
    userId: row.user_id,
    kind: row.kind,
    key: row.key,
    value: row.value,
    source: row.source,
    confidence: row.confidence,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  }
}

function formatMemoryItem(item: UserMemoryItem): string {
  const value = memoryValueToText(item.value)
  return `${item.kind}: ${item.key}${value ? ` — ${value}` : ''}`
}

function memoryValueToText(value: Record<string, unknown>): string {
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

function boundText(text: string): string {
  return text.length > SUMMARY_BUDGET ? `${text.slice(0, SUMMARY_BUDGET - 1)}…` : text
}

function isMemoryKind(value: unknown): value is MemoryKind {
  return typeof value === 'string' && MEMORY_KINDS.has(value as MemoryKind)
}

function isMemorySource(value: unknown): value is MemorySource {
  return typeof value === 'string' && MEMORY_SOURCES.has(value as MemorySource)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normaliseError(error: unknown): string {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return 'Memory store request failed'
}
