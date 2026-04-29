import type { AttainmentUpload } from '@/lib/attainmentStore'
import type { AttainmentRecord } from '@/lib/analytics/attainment'

export function combineAttainmentUploads(uploads: AttainmentUpload[]): AttainmentUpload {
  if (uploads.length === 0) {
    throw new Error('At least one upload is required.')
  }

  if (uploads.length === 1) return uploads[0]

  const id = createId()
  const records: AttainmentRecord[] = uploads.flatMap((upload) =>
    upload.records.map((record) => ({
      ...record,
      id: `${id}-${record.id}`,
      uploadId: id,
    })),
  )

  return {
    id,
    schoolId: uploads[0].schoolId,
    fileName: `${uploads.length} files combined`,
    originalColumns: unique(uploads.flatMap((upload) => upload.originalColumns)),
    detectedColumns: uploads[0].detectedColumns,
    detectedSummary: {
      rows: uploads.reduce((sum, upload) => sum + upload.detectedSummary.rows, 0),
      pupils: unique(records.map((record) => record.pupilId || record.pupilName)).length,
      subjects: unique(records.map((record) => record.subject)),
      terms: unique(records.map((record) => record.term)),
      yearGroups: unique(records.map((record) => record.yearGroup).filter(Boolean) as string[]),
      classes: unique(records.map((record) => record.className).filter(Boolean) as string[]),
      groups: unique(uploads.flatMap((upload) => upload.detectedSummary.groups)),
    },
    records,
    warnings: uploads.flatMap((upload) => upload.warnings),
    createdAt: new Date().toISOString(),
  }
}

export function renameUploadSubject(upload: AttainmentUpload, subject: string): AttainmentUpload {
  const cleanSubject = subject.trim() || 'Unknown subject'
  const records = upload.records.map((record) => ({
    ...record,
    subject: cleanSubject,
  }))

  return {
    ...upload,
    records,
    detectedSummary: {
      ...upload.detectedSummary,
      subjects: unique(records.map((record) => record.subject)),
    },
  }
}

export function renameUploadTerm(upload: AttainmentUpload, fromTerm: string, toTerm: string): AttainmentUpload {
  const cleanTerm = toTerm.trim() || fromTerm
  const records = upload.records.map((record) => ({
    ...record,
    term: record.term === fromTerm ? cleanTerm : record.term,
  }))

  return {
    ...upload,
    records,
    detectedSummary: {
      ...upload.detectedSummary,
      terms: unique(records.map((record) => record.term)),
    },
  }
}

function createId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `combined-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function unique(items: string[]): string[] {
  return [...new Set(items)].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}
