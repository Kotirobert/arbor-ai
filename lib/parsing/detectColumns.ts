export type DetectedColumnMap = {
  pupilName?: string
  firstName?: string
  lastName?: string
  upn?: string
  yearGroup?: string
  className?: string
  sex?: string
  fsm?: string
  ever6?: string
  send?: string
  eal?: string
  pupilPremium?: string
  subject?: string
  term?: string
  attainment?: string
  wideAttainmentColumns?: string[]
}

export type WideColumnInfo = {
  column: string
  subject: string
  term: string
  academicYear?: string
}

const columnSynonyms: Record<Exclude<keyof DetectedColumnMap, 'wideAttainmentColumns'>, string[]> = {
  pupilName: ['pupil', 'pupil name', 'student', 'student name', 'name', 'child'],
  firstName: ['first name', 'forename', 'legal forename'],
  lastName: ['last name', 'surname', 'legal surname'],
  upn: ['upn', 'unique pupil number'],
  yearGroup: ['year', 'year group', 'yeargroup', 'yr'],
  className: ['class', 'registration group', 'reg', 'form', 'tutor group'],
  sex: ['sex', 'gender', 'male/female', 'm/f'],
  fsm: ['fsm', 'free school meals'],
  ever6: ['ever6', 'ever 6', 'ever six'],
  send: ['send', 'sen', 'sen status'],
  eal: ['eal', 'english as additional language'],
  pupilPremium: ['pp', 'pupil premium', 'disadvantaged'],
  subject: ['subject'],
  term: ['term', 'assessment period', 'data drop'],
  attainment: ['attainment', 'grade', 'result', 'judgement', 'teacher judgement'],
}

const knownSubjects = [
  'English Reading',
  'English Writing',
  'Reading',
  'Writing',
  'Maths',
  'Mathematics',
  'Science',
  'RE',
  'History',
  'Geography',
  'Computing',
  'Art',
  'Music',
  'PE',
]

export function detectColumns(headers: string[]): DetectedColumnMap {
  const detected: DetectedColumnMap = {}

  for (const header of headers) {
    const normalised = normaliseHeader(header)
    for (const [field, synonyms] of Object.entries(columnSynonyms) as [keyof typeof columnSynonyms, string[]][]) {
      if (!detected[field] && synonyms.some((synonym) => normalised === normaliseHeader(synonym))) {
        detected[field] = header
      }
    }
  }

  const standardColumns = new Set(Object.values(detected).filter(Boolean))
  const wideAttainmentColumns = headers.filter((header) => {
    if (standardColumns.has(header)) return false
    return Boolean(parseWideColumn(header))
  })

  if (wideAttainmentColumns.length > 0) {
    detected.wideAttainmentColumns = wideAttainmentColumns
  }

  return detected
}

export function parseWideColumn(header: string): WideColumnInfo | null {
  const cleaned = header.trim().replace(/\s*-\s*/g, ' ').replace(/\s+/g, ' ')
  const lower = cleaned.toLowerCase()
  const subject = knownSubjects.find((candidate) => lower.startsWith(candidate.toLowerCase()))
  if (!subject) return null

  const academicYear = cleaned.match(/\b20\d{2}(?:[-/]\d{2,4})?\b/)?.[0]
  const termMatch = cleaned.match(/\b(Autumn|Spring|Summer)\b(?:\s+(20\d{2}(?:[-/]\d{2,4})?))?/i)
  const term = termMatch
    ? `${titleCase(termMatch[1])}${termMatch[2] ? ` ${termMatch[2]}` : academicYear ? ` ${academicYear}` : ''}`.trim()
    : academicYear ?? 'Current upload'

  return {
    column: header,
    subject: subject === 'Mathematics' ? 'Maths' : subject,
    term,
    academicYear,
  }
}

function normaliseHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}
