import {
  groupByDemographic,
  groupBySubject,
  type AttainmentRecord,
} from '@/lib/analytics/attainment'

export type InsightType = 'success' | 'warning' | 'risk' | 'gap' | 'trend' | 'info'

export type Insight = {
  type: InsightType
  text: string
}

export function generateInsights(records: AttainmentRecord[]): Insight[] {
  const insights: Insight[] = []
  const bySubject = groupBySubject(records)
  const bySex = groupByDemographic(records, 'sex')

  for (const [subjectName, subject] of Object.entries(bySubject)) {
    if (subject.exsPlusPct >= 85) {
      insights.push({ type: 'success', text: `${subjectName} is strong at ${subject.exsPlusPct}% expected or above.` })
    }

    if (subject.belowExpectedPct >= 30) {
      insights.push({ type: 'warning', text: `${subjectName} has ${subject.belowExpectedPct}% below expected.` })
    }
  }

  if (bySex.Female && bySex.Male) {
    const gap = Math.round(Math.abs(bySex.Female.exsPlusPct - bySex.Male.exsPlusPct) * 10) / 10
    if (gap >= 10) {
      insights.push({
        type: 'gap',
        text: bySex.Female.exsPlusPct > bySex.Male.exsPlusPct
          ? `Girls are ahead of boys by ${gap} percentage points.`
          : `Boys are ahead of girls by ${gap} percentage points.`,
      })
    }
  }

  if (insights.length === 0 && records.length > 0) {
    insights.push({ type: 'info', text: 'No major gaps stand out in the current filters.' })
  }

  return insights.slice(0, 6)
}
