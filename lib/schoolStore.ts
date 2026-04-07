/**
 * lib/schoolStore.ts
 *
 * Client-side in-memory + sessionStorage store for uploaded school data.
 *
 * Why sessionStorage and not localStorage?
 *   - Data persists across page navigations in the same tab session
 *   - Clears automatically when the tab closes (appropriate for sensitive school data)
 *   - No stale data from a previous upload contaminating the next session
 *
 * Migration path → PostgreSQL:
 *   Replace sessionStorage calls with fetch('/api/school-data') and the store
 *   becomes a thin SWR/React Query cache layer.
 */

import type { ParsedSchoolData } from '@/lib/csvParser'

const STORAGE_KEY = 'arbor-school-data'

// ── In-memory cache (survives re-renders, cleared on hard refresh) ─

let memoryCache: ParsedSchoolData | null = null

// ── Write ─────────────────────────────────────────────────────

export function storeSchoolData(data: ParsedSchoolData): void {
  memoryCache = data
  try {
    // sessionStorage has a ~5MB limit — fine for 210–2000 pupils
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (err) {
    // Quota exceeded — keep memory cache, warn in console
    console.warn('[schoolStore] sessionStorage quota exceeded, using memory cache only', err)
  }
}

// ── Read ──────────────────────────────────────────────────────

export function getSchoolData(): ParsedSchoolData | null {
  if (memoryCache) return memoryCache

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ParsedSchoolData
    memoryCache = parsed
    return parsed
  } catch {
    return null
  }
}

// ── Check ─────────────────────────────────────────────────────

export function hasSchoolData(): boolean {
  if (memoryCache) return true
  try {
    return sessionStorage.getItem(STORAGE_KEY) !== null
  } catch {
    return false
  }
}

// ── Clear ─────────────────────────────────────────────────────

export function clearSchoolData(): void {
  memoryCache = null
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch { /* empty */ }
}

// ── Last import timestamp ─────────────────────────────────────

export function getLastImportTime(): string | null {
  const data = getSchoolData()
  return data?.importedAt ?? null
}
