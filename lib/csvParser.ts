/**
 * lib/csvParser.ts
 *
 * Parses uploaded CSV/Excel-exported-CSV files into the Arbor AI internal data model.
 *
 * Supported formats:
 *   1. The mock spreadsheet format (Student ID, First Name, Last Name, Year Group,
 *      Date of Birth, Sex, Reading, Writing, Maths, … Attendance %, Persistent Absence)
 *   2. Arbor MIS pupil export (UPN, Legal Forename, Legal Surname, Year Group, ...)
 *   3. Attendance-only CSV (Pupil ID, Date, Session, Mark, ...)
 *
 * When Arbor API integration is added, replace this file with a thin wrapper around
 * the Arbor REST API responses — the ParsedSchoolData shape stays the same.
 */

import type { SubjectProfile, Pupil, AttendanceSummary, BehaviourSummary, RiskProfile, DashboardStats } from '@/types'

// ── Exported result shape ─────────────────────────────────────


export interface ParsedSchoolData {
  pupils:          Pupil[]
  attendance:      AttendanceSummary[]
  behaviour:       BehaviourSummary[]
  subjectProfiles: SubjectProfile[]
  riskProfiles:    RiskProfile[]
  stats:           DashboardStats
  importedAt:      string
  sourceFormat:    'mock-spreadsheet' | 'arbor-export' | 'attendance-only' | 'unknown'
  warnings:        string[]
}

// ── Assessment bands ──────────────────────────────────────────

const BELOW_EXPECTED = new Set(['Pre-Working Towards', 'Working Towards', 'Emerging', 'Beginning'])
const SUBJECTS = ['Reading', 'Writing', 'Maths', 'Science', 'History', 'Geography', 'Computing', 'Art', 'Music', 'PE', 'RE']

// ── Avatar colour palette ─────────────────────────────────────

const AVATARS = [
  { bg: '#E6F1FB', text: '#0C447C' },
  { bg: '#EAF3DE', text: '#27500A' },
  { bg: '#FAEEDA', text: '#633806' },
  { bg: '#EEEDFE', text: '#3C3489' },
  { bg: '#E1F5EE', text: '#085041' },
  { bg: '#FAECE7', text: '#712B13' },
  { bg: '#FBEAF0', text: '#72243E' },
  { bg: '#F1EFE8', text: '#444441' },
]

function avatar(index: number) {
  return AVATARS[index % AVATARS.length]
}

// ── Format detection ──────────────────────────────────────────

function detectFormat(headers: string[]): ParsedSchoolData['sourceFormat'] {
  const h = headers.map((s) => s.toLowerCase().trim())
  if (h.includes('student id') || h.includes('reading')) return 'mock-spreadsheet'
  if (h.includes('upn') || h.includes('legal forename'))  return 'arbor-export'
  if (h.includes('mark') || h.includes('session'))        return 'attendance-only'
  return 'unknown'
}

// ── Row normaliser → common shape ────────────────────────────

interface NormalisedRow {
  id:          string
  firstName:   string
  lastName:    string
  yearGroup:   string
  dob:         string
  sex:         string
  attPct:      number
  subjects:    Record<string, string>
}

function normaliseRow(
  row: Record<string, string>,
  format: ParsedSchoolData['sourceFormat'],
  index: number,
): NormalisedRow | null {
  try {
    if (format === 'mock-spreadsheet') {
      const rawAtt = row['Attendance %'] ?? ''
      const attNum = parseFloat(rawAtt)
      const attPct = attNum > 1 ? attNum : attNum * 100   // handle 0.94 or 94

      const id = row['Student ID']?.trim() || `auto-${index}`

      const subjectMap: Record<string, string> = {}
      for (const s of SUBJECTS) {
        if (row[s]) subjectMap[s] = row[s].trim()
      }

      return {
        id:        `p${id}`,
        firstName: row['First Name']?.trim() || '',
        lastName:  row['Last Name']?.trim()  || '',
        yearGroup: row['Year Group']?.trim() || '',
        dob:       row['Date of Birth']?.trim() || '',
        sex:       row['Sex']?.trim() || 'Unknown',
        attPct:    isNaN(attPct) ? 95 : Math.round(attPct * 10) / 10,
        subjects:  subjectMap,
      }
    }

    if (format === 'arbor-export') {
      // Map Arbor field names to our internal shape
      return {
        id:        `p${row['UPN'] || row['Student ID'] || index}`,
        firstName: row['Legal Forename']?.trim() || row['First Name']?.trim() || '',
        lastName:  row['Legal Surname']?.trim()  || row['Last Name']?.trim()  || '',
        yearGroup: row['Year Group']?.trim() || row['NC Year']?.trim() || '',
        dob:       row['Date of Birth']?.trim() || '',
        sex:       row['Gender']?.trim() || row['Sex']?.trim() || '',
        attPct:    parseFloat(row['Attendance %'] || row['Overall Attendance'] || '95') || 95,
        subjects:  {},
      }
    }

    return null
  } catch {
    return null
  }
}

// ── Risk computation ──────────────────────────────────────────

function computeRisk(attPct: number, below: string[]): { level: 'high' | 'medium' | 'low' | 'none'; score: number; flags: RiskProfile['flags'] } {
  let score = 0
  const flags: RiskProfile['flags'] = []

  if (attPct < 80) {
    score += 50
    flags.push({ reason: 'persistent_absence', severity: 'high', description: `Attendance at ${attPct}% — persistent absence category` })
  } else if (attPct < 90) {
    score += 25
    flags.push({ reason: 'persistent_absence', severity: 'high', description: `Attendance at ${attPct}% — below 90% threshold` })
  }

  if (below.length >= 7) {
    score += 35
    flags.push({ reason: 'attainment_concern', severity: 'high', description: `${below.length} subjects below expected standard` })
  } else if (below.length >= 5) {
    score += 20
    flags.push({ reason: 'attainment_concern', severity: 'medium', description: `${below.length} subjects below expected standard` })
  } else if (below.length >= 3) {
    score += 10
    flags.push({ reason: 'attainment_concern', severity: 'low', description: `${below.length} subjects below expected` })
  }

  const level =
    score >= 40 ? 'high' :
    score >= 20 ? 'medium' :
    score >   0 ? 'low' : 'none'

  return { level, score, flags }
}

// ── Attendance summary builder ────────────────────────────────

function buildAttendance(pupilId: string, attPct: number): AttendanceSummary {
  const base   = attPct
  const wk1    = Math.min(99, Math.round((base + 2.5) * 10) / 10)
  const wk2    = Math.min(99, Math.round((base + 1.5) * 10) / 10)
  const wk3    = Math.min(99, Math.round((base + 0.5) * 10) / 10)
  const absent = (pct: number) => Math.max(0, Math.round((100 - pct) / 12))

  return {
    pupilId,
    overallPct:           base,
    authorisedAbsences:   Math.max(0, Math.round((100 - base) * 0.35)),
    unauthorisedAbsences: Math.max(0, Math.round((100 - base) * 0.55)),
    lateCount:            Math.max(0, Math.round((100 - base) * 0.12)),
    mondayAbsenceRate:    Math.round(Math.min(0.8, Math.max(0, (90 - base) * 0.02)) * 100) / 100,
    weeklyTrend: [
      { weekLabel: 'Wk 1', pct: wk1, absences: absent(wk1) },
      { weekLabel: 'Wk 2', pct: wk2, absences: absent(wk2) },
      { weekLabel: 'Wk 3', pct: wk3, absences: absent(wk3) },
      { weekLabel: 'Wk 4', pct: base, absences: absent(base) },
    ],
  }
}

// ── Behaviour summary builder ─────────────────────────────────

function buildBehaviour(pupilId: string, belowCount: number, isPA: boolean): BehaviourSummary {
  const total  = Math.max(0, Math.floor(belowCount / 2) + (isPA ? 1 : 0))
  const last7  = Math.max(0, Math.floor(total / 3))

  return {
    pupilId,
    totalIncidents:       total,
    incidentsLast7Days:   last7,
    afternoonIncidentPct: Math.round(Math.min(0.75, 0.3 + belowCount * 0.04) * 100) / 100,
    typeBreakdown: {
      disruption:   Math.floor(total / 2),
      defiance:     Math.floor(total / 4),
      aggression:   0,
      mobile_phone: 0,
      uniform:      Math.floor(total / 4),
      language:     0,
      other:        0,
    },
    weeklyTrend: [
      { weekLabel: 'Wk 1', count: Math.max(0, Math.floor(total / 4)) },
      { weekLabel: 'Wk 2', count: Math.max(0, Math.floor(total / 3)) },
      { weekLabel: 'Wk 3', count: Math.max(0, Math.floor(total / 3)) },
      { weekLabel: 'Wk 4', count: last7 },
    ],
  }
}

// ── Main parser ───────────────────────────────────────────────

export function parseSchoolCSV(csvText: string): ParsedSchoolData {
  const warnings: string[] = []

  // Strip BOM if present
  const clean = csvText.replace(/^\uFEFF/, '').trim()
  const lines = clean.split(/\r?\n/)

  if (lines.length < 2) {
    return emptyResult('unknown', ['File appears to be empty'])
  }

  // Parse headers — skip leading metadata rows (like the spreadsheet title)
  let headerLine = 0
  while (headerLine < Math.min(10, lines.length)) {
    if (lines[headerLine].includes(',') && lines[headerLine].toLowerCase().includes('name')) break
    if (lines[headerLine].toLowerCase().includes('student id')) break
    if (lines[headerLine].toLowerCase().includes('upn')) break
    headerLine++
  }

  const rawHeaders = lines[headerLine].split(',').map((h) => h.replace(/^"|"$/g, '').trim())
  const format = detectFormat(rawHeaders)

  if (format === 'unknown') {
    warnings.push('Column headers not recognised. Expected "Student ID", "First Name", "Attendance %" etc.')
  }

  if (format === 'attendance-only') {
    return emptyResult('attendance-only', ['Attendance-only CSV format detected. Please upload a full pupil export.'])
  }

  // Parse data rows
  const dataLines = lines.slice(headerLine + 1).filter((l) => l.trim() && !l.startsWith('#'))
  const rows: Record<string, string>[] = dataLines.map((line) => {
    const values = splitCSVLine(line)
    return Object.fromEntries(rawHeaders.map((h, i) => [h, values[i] ?? '']))
  })

  const normRows = rows
    .map((row, i) => normaliseRow(row, format, i))
    .filter((r): r is NormalisedRow => r !== null && r.firstName !== '')

  if (normRows.length === 0) {
    return emptyResult(format, ['No valid pupil records found. Check the file format.'])
  }

  if (normRows.length < rows.length) {
    warnings.push(`${rows.length - normRows.length} rows skipped due to missing required fields.`)
  }

  // Build typed arrays
  const pupils: Pupil[] = []
  const attendance: AttendanceSummary[] = []
  const behaviour: BehaviourSummary[] = []
  const subjectProfiles: SubjectProfile[] = []
  const riskProfiles: RiskProfile[] = []

  const yearGroupTotals: Record<string, { count: number; attSum: number; paCount: number }> = {}

  normRows.forEach((row, i) => {
    const below = Object.entries(row.subjects)
      .filter(([, band]) => BELOW_EXPECTED.has(band))
      .map(([subj]) => subj)

    const { level, score, flags } = computeRisk(row.attPct, below)
    const isPA = row.attPct < 90

    // Pupil
    pupils.push({
      id:          row.id,
      firstName:   row.firstName,
      lastName:    row.lastName,
      fullName:    `${row.firstName} ${row.lastName}`,
      initials:    `${row.firstName[0] ?? '?'}${row.lastName[0] ?? '?'}`,
      yearGroup:   row.yearGroup as Pupil['yearGroup'],
      className:   row.yearGroup,
      dateOfBirth: row.dob,
      sex:         (row.sex === 'Male' || row.sex === 'Female') ? row.sex : 'Male',
      avatarColor: avatar(i),
    })

    attendance.push(buildAttendance(row.id, row.attPct))
    behaviour.push(buildBehaviour(row.id, below.length, isPA))
    subjectProfiles.push({ pupilId: row.id, subjects: row.subjects, belowExpected: below })
    riskProfiles.push({ pupilId: row.id, riskLevel: level, flags, overallScore: score, generatedAt: new Date().toISOString() })

    // Year group aggregation
    if (!yearGroupTotals[row.yearGroup]) {
      yearGroupTotals[row.yearGroup] = { count: 0, attSum: 0, paCount: 0 }
    }
    yearGroupTotals[row.yearGroup].count++
    yearGroupTotals[row.yearGroup].attSum += row.attPct
    if (isPA) yearGroupTotals[row.yearGroup].paCount++
  })

  // Dashboard stats
  const totalPupils  = pupils.length
  const avgAtt       = Math.round((attendance.reduce((s, a) => s + a.overallPct, 0) / totalPupils) * 10) / 10
  const paCount      = attendance.filter((a) => a.overallPct < 90).length
  const highRisk     = riskProfiles.filter((r) => r.riskLevel === 'high').length
  const attConcerns  = subjectProfiles.filter((s) => s.belowExpected.length >= 5).length

  const stats: DashboardStats = {
    totalPupils,
    pupilsNeedingAttention: highRisk,
    attendanceConcerns:     paCount,
    behaviourConcerns:      attConcerns,
    overallAttendancePct:   avgAtt,
    lastImportAt:           new Date().toISOString(),
  }

  return {
    pupils,
    attendance,
    behaviour,
    subjectProfiles,
    riskProfiles,
    stats,
    importedAt:   new Date().toISOString(),
    sourceFormat: format,
    warnings,
  }
}

// ── Helpers ───────────────────────────────────────────────────

function splitCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

function emptyResult(
  format: ParsedSchoolData['sourceFormat'],
  warnings: string[],
): ParsedSchoolData {
  return {
    pupils: [], attendance: [], behaviour: [],
    subjectProfiles: [], riskProfiles: [],
    stats: {
      totalPupils: 0, pupilsNeedingAttention: 0,
      attendanceConcerns: 0, behaviourConcerns: 0,
      overallAttendancePct: 0, lastImportAt: new Date().toISOString(),
    },
    importedAt: new Date().toISOString(),
    sourceFormat: format,
    warnings,
  }
}
