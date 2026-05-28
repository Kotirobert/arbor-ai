import {
  deleteMemory,
  listMemory,
  saveMemory,
  type MemoryStoreResult,
  type NewMemoryItem,
  type UserMemoryItem,
} from './memoryStore'
import { createClient } from '@/lib/supabase/client'

export type SavedResourceOutputType = 'text' | 'image' | 'pptx'

export interface SavedResource {
  id:           string
  type:         SavedResourceOutputType
  resourceType: string
  title:        string
  output:       string
  createdAt:    string
}

export type UnsavedResource = Omit<SavedResource, 'id'>

type SupabaseError = { message?: string } | null
type QueryResult<T> = Promise<{ data: T; error: SupabaseError }>
type MaybeSingleResult<T> = Promise<{ data: T | null; error: SupabaseError }>

type ResourceQueryBuilder<T> = {
  select: (columns?: string) => ResourceQueryBuilder<T>
  insert: (values: Record<string, unknown>) => ResourceQueryBuilder<T>
  delete: () => ResourceQueryBuilder<T>
  eq: (column: string, value: unknown) => ResourceQueryBuilder<T>
  order: (column: string, options?: { ascending?: boolean }) => QueryResult<T[]>
  single: () => MaybeSingleResult<T>
}

export type ResourceStoreClient = {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string } | null }; error: SupabaseError }>
  }
  from: (table: string) => ResourceQueryBuilder<Record<string, unknown>>
}

export interface ResourceStoreResult<T> {
  data: T
  error: string | null
}

export interface ResourceStoreOptions {
  supabase?: ResourceStoreClient
  createClient?: () => ResourceStoreClient
}

export interface SavedResourceMemoryContext {
  yearGroup?: string
  subject?: string
  outputStyle?: string
  getUserId?: () => Promise<string | null>
  listMemoryForUser?: typeof listMemory
  deleteMemoryForUser?: typeof deleteMemory
  saveMemoryForUser?: typeof saveMemory
}

export async function saveResource(
  resource: UnsavedResource,
  options: ResourceStoreOptions = {},
): Promise<ResourceStoreResult<SavedResource | null>> {
  const clientResult = getClient(options)
  if (clientResult.error !== null) return { data: null, error: clientResult.error }

  const userResult = await getAuthenticatedUserId(clientResult.client)
  if (userResult.error) return { data: null, error: userResult.error }

  try {
    const { data, error } = await clientResult.client
      .from('saved_resources')
      .insert({
        user_id: userResult.userId,
        type: resource.type,
        resource_type: resource.resourceType,
        title: resource.title,
        output: resource.output,
        created_at: resource.createdAt,
      })
      .select('*')
      .single()

    if (error) return { data: null, error: normaliseError(error) }

    const mapped = mapResourceRow(data)
    return mapped ? { data: mapped, error: null } : { data: null, error: 'Saved resource row was malformed' }
  } catch (error) {
    return { data: null, error: normaliseError(error) }
  }
}

export async function listResources(
  options: ResourceStoreOptions = {},
): Promise<ResourceStoreResult<SavedResource[]>> {
  const clientResult = getClient(options)
  if (clientResult.error !== null) return { data: [], error: clientResult.error }

  try {
    const { data, error } = await clientResult.client
      .from('saved_resources')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return { data: [], error: normaliseError(error) }

    return {
      data: (data ?? []).map(mapResourceRow).filter((resource): resource is SavedResource => Boolean(resource)),
      error: null,
    }
  } catch (error) {
    return { data: [], error: normaliseError(error) }
  }
}

export async function deleteResource(
  id: string,
  options: ResourceStoreOptions = {},
): Promise<ResourceStoreResult<{ deleted: boolean }>> {
  const clientResult = getClient(options)
  if (clientResult.error !== null) return { data: { deleted: false }, error: clientResult.error }

  try {
    const { data, error } = await clientResult.client
      .from('saved_resources')
      .delete()
      .eq('id', id)
      .select('id')
      .single()

    if (error) return { data: { deleted: false }, error: normaliseError(error) }

    return { data: { deleted: Boolean(data) }, error: null }
  } catch (error) {
    return { data: { deleted: false }, error: normaliseError(error) }
  }
}

export function buildSavedResourceMemory(
  resource: UnsavedResource | SavedResource,
  context: SavedResourceMemoryContext = {},
): NewMemoryItem {
  const yearGroup = context.yearGroup?.trim() || 'Unspecified year group'
  const subject = context.subject?.trim() || 'General'
  const outputStyle = context.outputStyle?.trim()

  return {
    kind: 'resource_signal',
    key: [
      'saved_resource',
      normaliseKeyPart(resource.resourceType),
      normaliseKeyPart(yearGroup),
      normaliseKeyPart(subject),
    ].join(':'),
    value: {
      resourceType: resource.resourceType,
      title: resource.title,
      yearGroup,
      subject,
      ...(outputStyle ? { outputStyle } : {}),
    },
    source: 'saved_resource',
    confidence: 0.7,
  }
}

export async function captureSavedResourceMemory(
  userId: string,
  resource: UnsavedResource | SavedResource,
  context: SavedResourceMemoryContext = {},
): Promise<MemoryStoreResult<UserMemoryItem | null>> {
  const listMemoryForUser = context.listMemoryForUser ?? listMemory
  const deleteMemoryForUser = context.deleteMemoryForUser ?? deleteMemory
  const saveMemoryForUser = context.saveMemoryForUser ?? saveMemory
  const memory = buildSavedResourceMemory(resource, context)

  const existing = await listMemoryForUser(userId)
  if (existing.error) return { data: null, error: existing.error }

  const duplicates = existing.data.filter((item) => (
    item.kind === 'resource_signal'
    && item.source === 'saved_resource'
    && item.key === memory.key
  ))

  for (const duplicate of duplicates) {
    const deleted = await deleteMemoryForUser(userId, duplicate.id)
    if (deleted.error) return { data: null, error: deleted.error }
  }

  return saveMemoryForUser(userId, memory)
}

export async function captureSavedResourceMemoryForCurrentUser(
  resource: UnsavedResource | SavedResource,
  context: SavedResourceMemoryContext = {},
): Promise<MemoryStoreResult<UserMemoryItem | null>> {
  const getUserId = context.getUserId ?? getCurrentUserId
  const userId = await getUserId()

  if (!userId) {
    return { data: null, error: null }
  }

  return captureSavedResourceMemory(userId, resource, context)
}

function normaliseKeyPart(value: string): string {
  const normalised = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalised || 'unknown'
}

async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.getUser()
    if (error) return null
    return data.user?.id ?? null
  } catch {
    return null
  }
}

function getClient(options: ResourceStoreOptions): { client: ResourceStoreClient; error: null } | { client?: never; error: string } {
  try {
    return {
      client: options.supabase ?? options.createClient?.() ?? createClient() as unknown as ResourceStoreClient,
      error: null,
    }
  } catch (error) {
    return { error: normaliseError(error) }
  }
}

async function getAuthenticatedUserId(client: ResourceStoreClient): Promise<{ userId: string; error: null } | { userId?: never; error: string }> {
  try {
    const { data, error } = await client.auth.getUser()
    if (error) return { error: normaliseError(error) }
    if (!data.user?.id) return { error: 'User is required to save resources' }
    return { userId: data.user.id, error: null }
  } catch (error) {
    return { error: normaliseError(error) }
  }
}

function mapResourceRow(row: Record<string, unknown> | null): SavedResource | null {
  if (!row) return null
  if (typeof row.id !== 'string') return null
  if (!isSavedResourceOutputType(row.type)) return null
  if (typeof row.resource_type !== 'string') return null
  if (typeof row.title !== 'string') return null
  if (typeof row.output !== 'string') return null
  if (typeof row.created_at !== 'string') return null

  return {
    id: row.id,
    type: row.type,
    resourceType: row.resource_type,
    title: row.title,
    output: row.output,
    createdAt: row.created_at,
  }
}

function isSavedResourceOutputType(value: unknown): value is SavedResourceOutputType {
  return value === 'text' || value === 'image' || value === 'pptx'
}

function normaliseError(error: unknown): string {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return 'Resource store request failed'
}
