import {
  calculatePupilMovement,
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
  subjectRows: ReportSubjectRow[]
  strongestSubject: { name: string; summary: AttainmentSummary } | null
  weakestSubject: { name: string; summary: AttainmentSummary } | null
  movementSummary: ReportMovementSummary | null
  interventionCount: number
  insights: Insight[]
}

export type ReportSubjectRow = {
  subject: string
  pupilCount: number
  recordCount: number
  prePct: number
  wtsPct: number
  exsPlusPct: number
  gdsPct: number
  belowExpectedPct: number
}

export type ReportMovementSummary = {
  fromTerm: string
  toTerm: string
  movedUp: number
  stayedSame: number
  slippedBack: number
  total: number
  slippedExamples: ReturnType<typeof calculatePupilMovement>
}

export function buildReportSummary(records: AttainmentRecord[]): ReportSummary {
  const subjects = Object.entries(groupBySubject(records))
  const ranked = [...subjects].sort(([, a], [, b]) => b.exsPlusPct - a.exsPlusPct)
  const terms = uniqueValues(records, 'term').sort(compareTerms)
  const movement = terms.length >= 2
    ? calculatePupilMovement(records, terms[terms.length - 2], terms[terms.length - 1])
    : []

  return {
    pupilCount: countUniquePupils(records),
    recordCount: records.length,
    subjectCount: uniqueValues(records, 'subject').length,
    termCount: uniqueValues(records, 'term').length,
    overall: summariseAttainment(records),
    subjectRows: subjects
      .map(([subject, summary]) => ({
        subject,
        pupilCount: countUniquePupils(records.filter((record) => record.subject === subject)),
        recordCount: summary.total,
        prePct: summary.prePct,
        wtsPct: summary.wtsPct,
        exsPlusPct: summary.exsPlusPct,
        gdsPct: summary.gdsPct,
        belowExpectedPct: summary.belowExpectedPct,
      }))
      .sort((a, b) => b.exsPlusPct - a.exsPlusPct || a.subject.localeCompare(b.subject)),
    strongestSubject: ranked[0] ? { name: ranked[0][0], summary: ranked[0][1] } : null,
    weakestSubject: ranked[ranked.length - 1] ? { name: ranked[ranked.length - 1][0], summary: ranked[ranked.length - 1][1] } : null,
    movementSummary: terms.length >= 2 ? {
      fromTerm: terms[terms.length - 2],
      toTerm: terms[terms.length - 1],
      movedUp: movement.filter((item) => item.movement === 'up').length,
      stayedSame: movement.filter((item) => item.movement === 'same').length,
      slippedBack: movement.filter((item) => item.movement === 'down').length,
      total: movement.length,
      slippedExamples: movement.filter((item) => item.movement === 'down').slice(0, 6),
    } : null,
    interventionCount: getInterventionCandidates(records).length,
    insights: generateInsights(records),
  }
}

function compareTerms(a: string, b: string): number {
  return termValue(a) - termValue(b) || a.localeCompare(b)
}

function termValue(term: string): number {
  const lower = term.toLowerCase()
  const year = Number(lower.match(/\b20\d{2}\b/)?.[0] ?? 0)
  const season = lower.includes('autumn') ? 1 : lower.includes('spring') ? 2 : lower.includes('summer') ? 3 : 0
  return year * 10 + season
}
