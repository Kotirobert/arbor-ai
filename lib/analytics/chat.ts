import {
  countUniquePupils,
  getInterventionCandidates,
  groupBySubject,
  summariseAttainment,
  type AttainmentRecord,
} from '@/lib/analytics/attainment'

export function answerAttainmentQuestion(question: string, records: AttainmentRecord[]): string {
  const q = question.trim().toLowerCase()
  if (records.length === 0) return 'There is no data in the current filters.'

  const summary = summariseAttainment(records)
  const pupilCount = countUniquePupils(records)
  const subjects = groupBySubject(records)
  const rankedSubjects = Object.entries(subjects).sort(([, a], [, b]) => b.exsPlusPct - a.exsPlusPct)

  if (q.includes('strongest') || q.includes('best') || q.includes('highest')) {
    const [subject, subjectSummary] = rankedSubjects[0]
    return `${subject} is currently strongest at ${subjectSummary.exsPlusPct}% expected or above, with ${subjectSummary.gdsPct}% at greater depth. Calculation: ${subjectSummary.exsPlus} of ${subjectSummary.total} records are EXS or GDS in the current filters.`
  }

  if (q.includes('weakest') || q.includes('lowest') || q.includes('concern')) {
    const [subject, subjectSummary] = [...rankedSubjects].sort(([, a], [, b]) => a.exsPlusPct - b.exsPlusPct)[0]
    return `${subject} currently needs the closest look: ${subjectSummary.belowExpectedPct}% are below expected and ${subjectSummary.exsPlusPct}% are expected or above. Calculation: ${subjectSummary.belowExpected} of ${subjectSummary.total} records are PRE or WTS in the current filters.`
  }

  if (q.includes('below') || q.includes('support') || q.includes('intervention') || q.includes('who needs')) {
    const candidates = getInterventionCandidates(records)
    if (candidates.length === 0) return 'No pupils are below expected in the current filters.'
    const names = candidates.slice(0, 5).map((candidate) => candidate.pupilName).join(', ')
    return `${candidates.length} pupils may need support. The first pupils to review are ${names}. Calculation: this uses the current filters and flags PRE/WTS, multi-subject concerns and pupils who slipped back.`
  }

  if (q.includes('how many') || q.includes('number of pupils') || q.includes('pupils')) {
    return `There are ${pupilCount} pupils in the current view, across ${records.length} attainment records. Current filters: ${uniqueDescriptor(records)}.`
  }

  if (q.includes('greater depth') || q.includes('gds')) {
    return `${summary.gdsPct}% of attainment records are at greater depth (${summary.gds} results). Calculation: ${summary.gds} of ${summary.total} current-filter records are GDS.`
  }

  if (q.includes('expected') || q.includes('exs')) {
    return `${summary.exsPlusPct}% are expected or above (${summary.exsPlus} results). Greater depth is included in expected or above. Calculation: EXS plus GDS across ${summary.total} current-filter records.`
  }

  return `In the current view, ${pupilCount} pupils have ${summary.exsPlusPct}% expected or above, ${summary.gdsPct}% greater depth, and ${summary.belowExpectedPct}% below expected. Calculation: current filters include ${records.length} attainment records. Try asking about strongest subject, pupils needing support, or greater depth.`
}

function uniqueDescriptor(records: AttainmentRecord[]): string {
  const subjects = [...new Set(records.map((record) => record.subject))].length
  const terms = [...new Set(records.map((record) => record.term))].length
  return `${subjects} subjects and ${terms} terms`
}
