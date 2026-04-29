import type { AttainmentRecord } from '@/lib/analytics/attainment'
import type { DetectedColumnMap } from '@/lib/parsing/detectColumns'
import type { DetectedSummary } from '@/lib/parsing/normaliseRows'

export type AttainmentUpload = {
  id: string
  schoolId: string
  fileName: string
  originalColumns: string[]
  detectedColumns: DetectedColumnMap
  detectedSummary: DetectedSummary
  records: AttainmentRecord[]
  warnings: string[]
  createdAt: string
}
