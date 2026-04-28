const STORAGE_KEY = 'chalkai-library'

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

function storage(): Storage | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `res-${crypto.randomUUID()}`
  }
  return `res-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function load(): SavedResource[] {
  const store = storage()
  if (!store) return []

  try {
    const parsed = JSON.parse(store.getItem(STORAGE_KEY) ?? '[]') as unknown
    return Array.isArray(parsed) ? parsed as SavedResource[] : []
  } catch {
    return []
  }
}

function persist(resources: SavedResource[]): void {
  const store = storage()
  if (!store) return
  store.setItem(STORAGE_KEY, JSON.stringify(resources))
}

export function saveResource(resource: UnsavedResource): SavedResource {
  const saved = { ...resource, id: createId() }
  persist([saved, ...load()])
  return saved
}

export function listResources(): SavedResource[] {
  return load()
}

export function deleteResource(id: string): void {
  persist(load().filter((resource) => resource.id !== id))
}
