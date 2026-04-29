import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { AttainmentUpload } from '@/lib/attainmentTypes'

type StoreShape = {
  uploads: AttainmentUpload[]
}

const STORE_FILE = 'uploads.json'

export async function listAttainmentUploads(schoolId: string): Promise<AttainmentUpload[]> {
  const store = await readStore()
  return store.uploads
    .filter((upload) => upload.schoolId === schoolId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getAttainmentUpload(schoolId: string, uploadId: string): Promise<AttainmentUpload | null> {
  const uploads = await listAttainmentUploads(schoolId)
  return uploads.find((upload) => upload.id === uploadId) ?? null
}

export async function saveAttainmentUpload(upload: AttainmentUpload): Promise<AttainmentUpload> {
  const store = await readStore()
  const uploads = [
    upload,
    ...store.uploads.filter((existing) => !(existing.schoolId === upload.schoolId && existing.id === upload.id)),
  ]
  await writeStore({ uploads })
  return upload
}

export async function deleteAttainmentUpload(schoolId: string, uploadId: string): Promise<boolean> {
  const store = await readStore()
  const nextUploads = store.uploads.filter((upload) => !(upload.schoolId === schoolId && upload.id === uploadId))
  await writeStore({ uploads: nextUploads })
  return nextUploads.length !== store.uploads.length
}

export async function clearAttainmentUploadsForSchool(schoolId: string): Promise<void> {
  const store = await readStore()
  await writeStore({ uploads: store.uploads.filter((upload) => upload.schoolId !== schoolId) })
}

async function readStore(): Promise<StoreShape> {
  try {
    const raw = await readFile(storePath(), 'utf8')
    const parsed = JSON.parse(raw) as StoreShape
    return { uploads: Array.isArray(parsed.uploads) ? parsed.uploads : [] }
  } catch {
    return { uploads: [] }
  }
}

async function writeStore(store: StoreShape): Promise<void> {
  await mkdir(dataDir(), { recursive: true })
  await writeFile(storePath(), JSON.stringify(store, null, 2), 'utf8')
}

function dataDir(): string {
  return process.env.ARBOR_ATTAINMENT_DATA_DIR || join(process.cwd(), '.data', 'arbor-attainment')
}

function storePath(): string {
  return join(dataDir(), STORE_FILE)
}
