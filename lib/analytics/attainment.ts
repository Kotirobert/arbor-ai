export type Band = 'PRE' | 'WTS' | 'EXS' | 'GDS' | 'UNKNOWN'

export type AttainmentRecord = {
  id: string
  uploadId: string
  schoolId: string
  pupilId?: string
  pupilName: string
  upn?: string
  yearGroup?: string
  className?: string
  subject: string
  term: string
  academicYear?: string
  sex?: 'Male' | 'Female' | 'Unknown'
  fsm?: boolean | null
  ever6?: boolean | null
  send?: boolean | null
  eal?: boolean | null
  pupilPremium?: boolean | null
  rawAttainment: string
  attainmentBand: Band
  sourceFileName: string
  createdAt: string
}

export type AttainmentSummary = {
  total: number
  pre: number
  wts: number
  exs: number
  gds: number
  unknown: number
  prePct: number
  wtsPct: number
  exsPct: number
  gdsPct: number
  unknownPct: number
  exsPlus: number
  exsPlusPct: number
  belowExpected: number
  belowExpectedPct: number
}

export type DashboardSection =
  | 'overviewCards'
  | 'subjectCards'
  | 'attainmentStackedBars'
  | 'boysGirlsComparison'
  | 'groupComparison'
  | 'yearGroupHeatmap'
  | 'classComparison'
  | 'trendChart'
  | 'pupilMovement'
  | 'interventionList'
  | 'sltReport'

export type PupilMovement = {
  pupilName: string
  subject: string
  fromTerm: string
  toTerm: string
  fromBand: Band
  toBand: Band
  movement: 'up' | 'same' | 'down'
}

export type InterventionCandidate = {
  pupilName: string
  yearGroup?: string
  className?: string
  subjectsBelowExpected: string[]
  currentBands: Record<string, Band>
  reason: string
  priority: 'High' | 'Medium' | 'Low'
}

const attainmentMap: Record<string, Band> = {
  pre: 'PRE',
  'pre-working towards': 'PRE',
  'pre working towards': 'PRE',
  below: 'PRE',
  b: 'PRE',
  wts: 'WTS',
  'working towards': 'WTS',
  'working towards standard': 'WTS',
  exs: 'EXS',
  expected: 'EXS',
  'expected standard': 'EXS',
  'at expected': 'EXS',
  gds: 'GDS',
  'greater depth': 'GDS',
  'greater depth standard': 'GDS',
}

const bandRank: Record<Band, number> = {
  UNKNOWN: 0,
  PRE: 1,
  WTS: 2,
  EXS: 3,
  GDS: 4,
}

const demographicLabels: Record<string, Record<string, string>> = {
  fsm: { true: 'FSM', false: 'Not FSM' },
  ever6: { true: 'Ever 6', false: 'Not Ever 6' },
  send: { true: 'SEND', false: 'No SEND' },
  eal: { true: 'EAL', false: 'Not EAL' },
  pupilPremium: { true: 'Pupil premium', false: 'Not pupil premium' },
}

export function normaliseAttainmentBand(value: string | null | undefined): Band {
  const key = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')

  return attainmentMap[key] ?? 'UNKNOWN'
}

export function pct(part: number, total: number): number {
  if (total === 0) return 0
  return Math.round((part / total) * 1000) / 10
}

export function summariseAttainment(records: AttainmentRecord[]): AttainmentSummary {
  const total = records.length
  const pre = countBand(records, 'PRE')
  const wts = countBand(records, 'WTS')
  const exs = countBand(records, 'EXS')
  const gds = countBand(records, 'GDS')
  const unknown = countBand(records, 'UNKNOWN')
  const exsPlus = exs + gds
  const belowExpected = pre + wts

  return {
    total,
    pre,
    wts,
    exs,
    gds,
    unknown,
    prePct: pct(pre, total),
    wtsPct: pct(wts, total),
    exsPct: pct(exs, total),
    gdsPct: pct(gds, total),
    unknownPct: pct(unknown, total),
    exsPlus,
    exsPlusPct: pct(exsPlus, total),
    belowExpected,
    belowExpectedPct: pct(belowExpected, total),
  }
}

export function groupBySubject(records: AttainmentRecord[]): Record<string, AttainmentSummary> {
  return groupAndSummarise(records, (record) => record.subject)
}

export function groupByYearGroup(records: AttainmentRecord[]): Record<string, AttainmentSummary> {
  return groupAndSummarise(records, (record) => record.yearGroup)
}

export function groupByClass(records: AttainmentRecord[]): Record<string, AttainmentSummary> {
  return groupAndSummarise(records, (record) => record.className)
}

export function groupByTerm(records: AttainmentRecord[]): Record<string, AttainmentSummary> {
  return groupAndSummarise(records, (record) => record.term)
}

export function groupByDemographic(
  records: AttainmentRecord[],
  field: 'sex' | 'fsm' | 'ever6' | 'send' | 'eal' | 'pupilPremium',
): Record<string, AttainmentSummary> {
  return groupAndSummarise(records, (record) => {
    const value = record[field]
    if (value === null || value === undefined) return undefined
    if (typeof value === 'boolean') return demographicLabels[field][String(value)]
    return String(value)
  })
}

export function getAvailableDimensions(records: AttainmentRecord[]) {
  const valueCount = (field: keyof AttainmentRecord) => unique(records.map((record) => record[field]).filter(Boolean)).length

  const hasFSM = records.some((record) => record.fsm !== null && record.fsm !== undefined)
  const hasEver6 = records.some((record) => record.ever6 !== null && record.ever6 !== undefined)
  const hasSEND = records.some((record) => record.send !== null && record.send !== undefined)
  const hasEAL = records.some((record) => record.eal !== null && record.eal !== undefined)
  const hasPupilPremium = records.some((record) => record.pupilPremium !== null && record.pupilPremium !== undefined)

  return {
    subjectCount: valueCount('subject'),
    termCount: valueCount('term'),
    yearGroupCount: valueCount('yearGroup'),
    classCount: valueCount('className'),
    hasSex: records.some((record) => Boolean(record.sex)),
    hasFSM,
    hasEver6,
    hasSEND,
    hasEAL,
    hasPupilPremium,
    hasGroups: records.some((record) =>
      Boolean(record.sex) ||
      record.fsm !== null && record.fsm !== undefined ||
      record.ever6 !== null && record.ever6 !== undefined ||
      record.send !== null && record.send !== undefined ||
      record.eal !== null && record.eal !== undefined ||
      record.pupilPremium !== null && record.pupilPremium !== undefined,
    ),
  }
}

export function getDashboardSections(records: AttainmentRecord[]): DashboardSection[] {
  const dimensions = getAvailableDimensions(records)
  const sections: DashboardSection[] = ['overviewCards', 'subjectCards', 'attainmentStackedBars']

  if (dimensions.hasSex) sections.push('boysGirlsComparison')
  if (dimensions.hasGroups) sections.push('groupComparison')
  if (dimensions.yearGroupCount > 1) sections.push('yearGroupHeatmap')
  if (dimensions.classCount > 1) sections.push('classComparison')
  if (dimensions.termCount > 1) sections.push('trendChart', 'pupilMovement')

  sections.push('interventionList', 'sltReport')
  return sections
}

export function calculatePupilMovement(
  records: AttainmentRecord[],
  fromTerm: string,
  toTerm: string,
): PupilMovement[] {
  const fromRecords = records.filter((record) => record.term === fromTerm)
  const toRecords = records.filter((record) => record.term === toTerm)
  const toByKey = new Map(toRecords.map((record) => [movementKey(record), record]))

  return fromRecords
    .map((fromRecord) => {
      const toRecord = toByKey.get(movementKey(fromRecord))
      if (!toRecord) return null

      const delta = bandRank[toRecord.attainmentBand] - bandRank[fromRecord.attainmentBand]
      return {
        pupilName: fromRecord.pupilName,
        subject: fromRecord.subject,
        fromTerm,
        toTerm,
        fromBand: fromRecord.attainmentBand,
        toBand: toRecord.attainmentBand,
        movement: delta > 0 ? 'up' : delta < 0 ? 'down' : 'same',
      } satisfies PupilMovement
    })
    .filter((movement): movement is PupilMovement => movement !== null)
}

export function getInterventionCandidates(
  records: AttainmentRecord[],
  movement: PupilMovement[] = [],
): InterventionCandidate[] {
  const latestByPupilSubject = latestRecordByPupilSubject(records)
  const byPupil = new Map<string, AttainmentRecord[]>()

  for (const record of latestByPupilSubject.values()) {
    const key = pupilKey(record)
    byPupil.set(key, [...(byPupil.get(key) ?? []), record])
  }

  const slipped = new Set(
    movement
      .filter((item) => item.movement === 'down')
      .map((item) => `${item.pupilName.toLowerCase()}::${item.subject.toLowerCase()}`),
  )

  const candidates: InterventionCandidate[] = []

  for (const pupilRecords of byPupil.values()) {
    const exemplar = pupilRecords[0]
    const currentBands = Object.fromEntries(
      pupilRecords
        .sort((a, b) => a.subject.localeCompare(b.subject))
        .map((record) => [record.subject, record.attainmentBand]),
    )
    const subjectsBelowExpected = pupilRecords
      .filter((record) => record.attainmentBand === 'PRE' || record.attainmentBand === 'WTS')
      .map((record) => record.subject)
      .sort((a, b) => a.localeCompare(b))
    const hasPre = pupilRecords.some((record) => record.attainmentBand === 'PRE')
    const slippedSubjects = pupilRecords.filter((record) => slipped.has(`${record.pupilName.toLowerCase()}::${record.subject.toLowerCase()}`))
    const hasSlipped = slippedSubjects.length > 0

    if (subjectsBelowExpected.length === 0 && !hasSlipped) continue

    const priority: InterventionCandidate['priority'] =
      hasPre || subjectsBelowExpected.length >= 2 || hasSlipped ? 'High' :
      subjectsBelowExpected.length === 1 ? 'Medium' :
      'Low'

    const reason = hasSlipped
      ? `Slipped back in ${slippedSubjects.map((record) => record.subject).join(', ')}.`
      : subjectsBelowExpected.length >= 2
        ? `Below expected in ${subjectsBelowExpected.length} subjects.`
        : `Needs support in ${subjectsBelowExpected[0]}.`

    candidates.push({
      pupilName: exemplar.pupilName,
      yearGroup: exemplar.yearGroup,
      className: exemplar.className,
      subjectsBelowExpected,
      currentBands,
      reason,
      priority,
    })
  }

  return candidates.sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority) || a.pupilName.localeCompare(b.pupilName))
}

export function filterRecords(
  records: AttainmentRecord[],
  filters: Partial<Record<'term' | 'subject' | 'yearGroup' | 'className' | 'sex' | 'fsm' | 'send' | 'eal' | 'pupilPremium', string>>,
): AttainmentRecord[] {
  return records.filter((record) => {
    if (filters.term && record.term !== filters.term) return false
    if (filters.subject && record.subject !== filters.subject) return false
    if (filters.yearGroup && record.yearGroup !== filters.yearGroup) return false
    if (filters.className && record.className !== filters.className) return false
    if (filters.sex && record.sex !== filters.sex) return false
    if (filters.fsm && String(record.fsm) !== filters.fsm) return false
    if (filters.send && String(record.send) !== filters.send) return false
    if (filters.eal && String(record.eal) !== filters.eal) return false
    if (filters.pupilPremium && String(record.pupilPremium) !== filters.pupilPremium) return false
    return true
  })
}

export function countUniquePupils(records: AttainmentRecord[]): number {
  return unique(records.map((record) => pupilKey(record))).length
}

export function uniqueValues(records: AttainmentRecord[], field: keyof AttainmentRecord): string[] {
  return unique(records.map((record) => record[field]).filter(Boolean).map(String))
}

function countBand(records: AttainmentRecord[], band: Band): number {
  return records.filter((record) => record.attainmentBand === band).length
}

function groupAndSummarise(
  records: AttainmentRecord[],
  selector: (record: AttainmentRecord) => string | undefined | null,
): Record<string, AttainmentSummary> {
  const groups = new Map<string, AttainmentRecord[]>()
  for (const record of records) {
    const key = selector(record)
    if (!key) continue
    groups.set(key, [...(groups.get(key) ?? []), record])
  }

  return Object.fromEntries(
    [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
      .map(([key, group]) => [key, summariseAttainment(group)]),
  )
}

function latestRecordByPupilSubject(records: AttainmentRecord[]): Map<string, AttainmentRecord> {
  const sorted = [...records].sort((a, b) => termSortValue(a.term) - termSortValue(b.term))
  const latest = new Map<string, AttainmentRecord>()

  for (const record of sorted) {
    latest.set(`${pupilKey(record)}::${record.subject.toLowerCase()}`, record)
  }

  return latest
}

function movementKey(record: AttainmentRecord): string {
  return `${pupilKey(record)}::${record.subject.toLowerCase()}`
}

function pupilKey(record: AttainmentRecord): string {
  return (record.pupilId || record.upn || `${record.pupilName}-${record.className ?? ''}-${record.yearGroup ?? ''}`).toLowerCase()
}

function priorityRank(priority: InterventionCandidate['priority']): number {
  return priority === 'High' ? 0 : priority === 'Medium' ? 1 : 2
}

function termSortValue(term: string): number {
  const lower = term.toLowerCase()
  const year = Number(lower.match(/\b(20\d{2})\b/)?.[1] ?? 0)
  const season =
    lower.includes('autumn') ? 1 :
    lower.includes('spring') ? 2 :
    lower.includes('summer') ? 3 :
    0

  return year * 10 + season
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)].sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }))
}
