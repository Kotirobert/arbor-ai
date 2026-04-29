import { normaliseAttainmentBand, type AttainmentRecord } from '@/lib/analytics/attainment'
import { parseWideColumn, type DetectedColumnMap } from '@/lib/parsing/detectColumns'

export type DetectedSummary = {
  rows: number
  pupils: number
  subjects: string[]
  terms: string[]
  yearGroups: string[]
  classes: string[]
  groups: string[]
}

export type NormaliseRowsOptions = {
  uploadId: string
  schoolId: string
  sourceFileName: string
  detectedColumns: DetectedColumnMap
  createdAt?: string
}

export type NormaliseRowsResult = {
  records: AttainmentRecord[]
  summary: DetectedSummary
  warnings: string[]
}

export function normaliseRows(
  rows: Record<string, string>[],
  options: NormaliseRowsOptions,
): NormaliseRowsResult {
  const records: AttainmentRecord[] = []
  const warnings: string[] = []
  const createdAt = options.createdAt ?? new Date().toISOString()
  const wideColumns = options.detectedColumns.wideAttainmentColumns ?? []
  const filenameSubject = inferSubjectFromFileName(options.sourceFileName)
  const filenameAttainmentColumns = filenameSubject
    ? detectFilenameSubjectAttainmentColumns(rows, options.detectedColumns)
    : []
  const filenameAcademicYear = inferAcademicYearFromFileName(options.sourceFileName)

  rows.forEach((row, rowIndex) => {
    const common = readCommonFields(row, options.detectedColumns)
    if (!common.pupilName) {
      warnings.push(`Row ${rowIndex + 1} was skipped because no pupil name was found.`)
      return
    }

    if (options.detectedColumns.subject && options.detectedColumns.attainment) {
      const rawAttainment = get(row, options.detectedColumns.attainment)
      if (rawAttainment) {
        records.push(makeRecord({
          ...common,
          rowIndex,
          subject: get(row, options.detectedColumns.subject) || 'Unknown subject',
          term: options.detectedColumns.term ? get(row, options.detectedColumns.term) || 'Unknown term' : 'Unknown term',
          rawAttainment,
          academicYear: extractAcademicYear(options.detectedColumns.term ? get(row, options.detectedColumns.term) : ''),
          options,
          createdAt,
        }))
      }
    }

    for (const column of wideColumns) {
      const rawAttainment = get(row, column)
      const info = parseWideColumn(column)
      if (!rawAttainment || !info) continue

      records.push(makeRecord({
        ...common,
        rowIndex,
        subject: info.subject,
        term: info.term,
        academicYear: info.academicYear,
        rawAttainment,
        options,
        createdAt,
      }))
    }

    for (const column of filenameAttainmentColumns) {
      const rawAttainment = get(row, column)
      if (!rawAttainment) continue

      records.push(makeRecord({
        ...common,
        rowIndex,
        subject: filenameSubject ?? 'Unknown subject',
        term: inferTermFromColumn(column, filenameAcademicYear),
        academicYear: filenameAcademicYear,
        rawAttainment,
        options,
        createdAt,
      }))
    }
  })

  return {
    records,
    summary: summariseRecords(records, rows.length),
    warnings,
  }
}

function detectFilenameSubjectAttainmentColumns(
  rows: Record<string, string>[],
  columns: DetectedColumnMap,
): string[] {
  const firstRow = rows[0] ?? {}
  const standardColumns = new Set(Object.values(columns).flat().filter(Boolean))

  return Object.keys(firstRow).filter((column) => {
    if (standardColumns.has(column)) return false
    if (!isFilenameSubjectAttainmentColumn(column)) return false
    const values = rows.map((row) => get(row, column)).filter(Boolean)
    if (values.length === 0) return false
    const recognised = values.filter((value) => normaliseAttainmentBand(value) !== 'UNKNOWN').length
    return recognised > 0 && recognised / values.length >= 0.6
  })
}

function isFilenameSubjectAttainmentColumn(column: string): boolean {
  const lower = column.trim().toLowerCase().replace(/\s+/g, ' ')
  const isTermColumn = /\b(autumn|spring|summer)\b/.test(lower)

  if (/\bcurriculum expectations?\b/.test(lower)) return false
  if (/\bacademic year\b/.test(lower) && !isTermColumn) return false

  return true
}

function inferSubjectFromFileName(fileName: string): string | null {
  const withoutExtension = fileName.replace(/\.[^.]+$/, '')
  const afterMarkbook = withoutExtension.match(/markbook\s*-\s*(.+)$/i)?.[1] ?? withoutExtension
  const withoutDates = afterMarkbook
    .replace(/\b20\d{2}[-/]\d{2,4}\b/g, '')
    .replace(/\b20\d{2}\b/g, '')
    .trim()
    .replace(/\s+/g, ' ')

  const subjectMap: Array<[RegExp, string]> = [
    [/english reading/i, 'English Reading'],
    [/english writing/i, 'English Writing'],
    [/mathematics|maths/i, 'Maths'],
    [/religious education|\bre\b/i, 'Religious Education'],
    [/science/i, 'Science'],
    [/reading/i, 'Reading'],
    [/writing/i, 'Writing'],
  ]

  return subjectMap.find(([pattern]) => pattern.test(withoutDates))?.[1] ?? null
}

function inferAcademicYearFromFileName(fileName: string): string | undefined {
  return fileName.match(/\b20\d{2}[-/]20\d{2}\b/)?.[0] ??
    fileName.match(/\b20\d{2}[-/]\d{2}\b/)?.[0]
}

function inferTermFromColumn(column: string, academicYear?: string): string {
  const lower = column.toLowerCase()
  const startYear = Number(academicYear?.match(/\b(20\d{2})/)?.[1] ?? '')
  const endYear = academicYear ? startYear + 1 : undefined

  if (lower.includes('autumn')) return `Autumn ${startYear || ''}`.trim()
  if (lower.includes('spring')) return `Spring ${endYear || startYear || ''}`.trim()
  if (lower.includes('summer')) return `Summer ${endYear || startYear || ''}`.trim()

  const explicitYear = column.match(/\b20\d{2}\b/)?.[0]
  return explicitYear ? `${column} ${explicitYear}`.trim() : column
}

function readCommonFields(row: Record<string, string>, columns: DetectedColumnMap) {
  return {
    pupilName: columns.pupilName ? get(row, columns.pupilName) : combineName(row, columns),
    upn: columns.upn ? get(row, columns.upn) || undefined : undefined,
    yearGroup: columns.yearGroup ? get(row, columns.yearGroup) || undefined : undefined,
    className: columns.className ? get(row, columns.className) || undefined : undefined,
    sex: columns.sex ? normaliseSex(get(row, columns.sex)) : undefined,
    fsm: columns.fsm ? normaliseBoolean(get(row, columns.fsm)) : null,
    ever6: columns.ever6 ? normaliseBoolean(get(row, columns.ever6)) : null,
    send: columns.send ? normaliseBoolean(get(row, columns.send)) : null,
    eal: columns.eal ? normaliseBoolean(get(row, columns.eal)) : null,
    pupilPremium: columns.pupilPremium ? normaliseBoolean(get(row, columns.pupilPremium)) : null,
  }
}

function combineName(row: Record<string, string>, columns: DetectedColumnMap): string {
  const first = columns.firstName ? get(row, columns.firstName) : ''
  const last = columns.lastName ? get(row, columns.lastName) : ''
  return `${first} ${last}`.trim()
}

function makeRecord(args: ReturnType<typeof readCommonFields> & {
  rowIndex: number
  subject: string
  term: string
  academicYear?: string
  rawAttainment: string
  options: NormaliseRowsOptions
  createdAt: string
}): AttainmentRecord {
  const pupilIdentifier = args.upn || slug(args.pupilName)
  const subject = args.subject.trim() || 'Unknown subject'
  const term = args.term.trim() || 'Unknown term'

  return {
    id: `${args.options.uploadId}-${args.rowIndex}-${slug(subject)}-${slug(term)}`,
    uploadId: args.options.uploadId,
    schoolId: args.options.schoolId,
    pupilId: pupilIdentifier,
    pupilName: args.pupilName,
    upn: args.upn,
    yearGroup: args.yearGroup,
    className: args.className,
    subject,
    term,
    academicYear: args.academicYear ?? extractAcademicYear(term),
    sex: args.sex,
    fsm: args.fsm,
    ever6: args.ever6,
    send: args.send,
    eal: args.eal,
    pupilPremium: args.pupilPremium,
    rawAttainment: args.rawAttainment,
    attainmentBand: normaliseAttainmentBand(args.rawAttainment),
    sourceFileName: args.options.sourceFileName,
    createdAt: args.createdAt,
  }
}

function summariseRecords(records: AttainmentRecord[], rows: number): DetectedSummary {
  const groups = [
    records.some((record) => record.sex) ? 'Sex' : null,
    records.some((record) => record.fsm !== null && record.fsm !== undefined) ? 'FSM' : null,
    records.some((record) => record.ever6 !== null && record.ever6 !== undefined) ? 'Ever6' : null,
    records.some((record) => record.send !== null && record.send !== undefined) ? 'SEND' : null,
    records.some((record) => record.eal !== null && record.eal !== undefined) ? 'EAL' : null,
    records.some((record) => record.pupilPremium !== null && record.pupilPremium !== undefined) ? 'Pupil Premium' : null,
  ].filter((group): group is string => group !== null)

  return {
    rows,
    pupils: unique(records.map((record) => record.pupilId || record.pupilName)).length,
    subjects: unique(records.map((record) => record.subject)),
    terms: unique(records.map((record) => record.term)),
    yearGroups: unique(records.map((record) => record.yearGroup).filter(Boolean) as string[]),
    classes: unique(records.map((record) => record.className).filter(Boolean) as string[]),
    groups,
  }
}

function normaliseSex(value: string): 'Male' | 'Female' | 'Unknown' {
  const lower = value.trim().toLowerCase()
  if (lower === 'm' || lower === 'male' || lower === 'boy') return 'Male'
  if (lower === 'f' || lower === 'female' || lower === 'girl') return 'Female'
  return value.trim() ? 'Unknown' : 'Unknown'
}

function normaliseBoolean(value: string): boolean | null {
  const lower = value.trim().toLowerCase()
  if (!lower) return null
  if (['yes', 'y', 'true', '1', 'fsm', 'send', 'sen', 'eal', 'pp'].includes(lower)) return true
  if (['no', 'n', 'false', '0'].includes(lower)) return false
  return null
}

function get(row: Record<string, string>, key: string): string {
  return String(row[key] ?? '').trim()
}

function slug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unknown'
}

function extractAcademicYear(value: string | undefined): string | undefined {
  return value?.match(/\b20\d{2}(?:[-/]\d{2,4})?\b/)?.[0]
}

function unique(items: string[]): string[] {
  return [...new Set(items)].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}
