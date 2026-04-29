import {
  countUniquePupils,
  getInterventionCandidates,
  groupBySubject,
  summariseAttainment,
  uniqueValues,
  type AttainmentRecord,
  type AttainmentSummary,
} from '@/lib/analytics/attainment'
import { generateInsights, type Insight } from '@/lib/analytics/insights'

export type ReportSummary = {
  pupilCount: number
  recordCount: number
  subjectCount: number
  termCount: number
  overall: AttainmentSummary
  strongestSubject: { name: string; summary: AttainmentSummary } | null
  weakestSubject: { name: string; summary: AttainmentSummary } | null
  interventionCount: number
  insights: Insight[]
}

export function buildReportSummary(records: AttainmentRecord[]): ReportSummary {
  const subjects = Object.entries(groupBySubject(records))
  const ranked = [...subjects].sort(([, a], [, b]) => b.exsPlusPct - a.exsPlusPct)

  return {
    pupilCount: countUniquePupils(records),
    recordCount: records.length,
    subjectCount: uniqueValues(records, 'subject').length,
    termCount: uniqueValues(records, 'term').length,
    overall: summariseAttainment(records),
    strongestSubject: ranked[0] ? { name: ranked[0][0], summary: ranked[0][1] } : null,
    weakestSubject: ranked[ranked.length - 1] ? { name: ranked[ranked.length - 1][0], summary: ranked[ranked.length - 1][1] } : null,
    interventionCount: getInterventionCandidates(records).length,
    insights: generateInsights(records),
  }
}
