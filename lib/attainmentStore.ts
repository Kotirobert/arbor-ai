'use client'

export type { AttainmentUpload } from '@/lib/attainmentTypes'
import type { AttainmentUpload } from '@/lib/attainmentTypes'

export async function storeAttainmentUpload(upload: AttainmentUpload): Promise<AttainmentUpload> {
  const response = await fetch('/api/uploads/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(upload),
  })
  const json = await response.json() as { upload?: AttainmentUpload; error?: string }
  if (!response.ok || !json.upload) throw new Error(json.error ?? 'Upload could not be saved.')
  return json.upload
}

export async function getAttainmentUploads(): Promise<AttainmentUpload[]> {
  const response = await fetch('/api/uploads', { cache: 'no-store' })
  const json = await response.json() as { uploads?: AttainmentUpload[] }
  return json.uploads ?? []
}

export async function getAttainmentUpload(id: string): Promise<AttainmentUpload | null> {
  const response = await fetch(`/api/uploads/${encodeURIComponent(id)}`, { cache: 'no-store' })
  if (response.status === 404) return null
  const json = await response.json() as { upload?: AttainmentUpload }
  return json.upload ?? null
}

export async function deleteAttainmentUpload(id: string): Promise<void> {
  await fetch(`/api/uploads/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function clearAttainmentUploads(): Promise<void> {
  await fetch('/api/uploads', { method: 'DELETE' })
}
