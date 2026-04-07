/**
 * Data access layer — Arbor AI
 *
 * Priority order for data sources:
 *   1. Uploaded school data (from sessionStorage via schoolStore)
 *   2. Static mock data (fallback for demo / first load)
 *
 * Migration path → PostgreSQL:
 *   Replace the mock imports + schoolStore reads with Prisma queries.
 *   Function signatures stay identical.
 */

import type {
  UserRole, Pupil, AttendanceSummary, BehaviourSummary,
  RiskProfile, DashboardStats, SubjectProfile,
} from '@/types'

import {
  MOCK_PUPILS, MOCK_ATTENDANCE, MOCK_BEHAVIOUR,
  MOCK_RISK_PROFILES, MOCK_SUBJECT_PROFILES, MOCK_DASHBOARD_STATS,
} from './mock'

// ── Source selection ──────────────────────────────────────────
// Server components cannot read sessionStorage, so uploaded data is
// passed in via the page → DashboardClient boundary.
// These functions always run server-side and use mock data.
// The DashboardClient merges live store data on the client.

interface AccessScope {
  role:       UserRole
  yearGroup?: string
  className?: string
}

// Re-export so components can import SubjectProfile from here
export type { SubjectProfile } from '@/types'

// ── Data resolution ───────────────────────────────────────────

export interface SchoolDataSource {
  pupils:          Pupil[]
  attendance:      AttendanceSummary[]
  behaviour:       BehaviourSummary[]
  subjectProfiles: SubjectProfile[]
  riskProfiles:    RiskProfile[]
  stats:           DashboardStats
}

export function getMockDataSource(): SchoolDataSource {
  return {
    pupils:          MOCK_PUPILS,
    attendance:      MOCK_ATTENDANCE,
    behaviour:       MOCK_BEHAVIOUR,
    subjectProfiles: MOCK_SUBJECT_PROFILES,
    riskProfiles:    MOCK_RISK_PROFILES,
    stats:           MOCK_DASHBOARD_STATS,
  }
}

// ── Scope filtering ───────────────────────────────────────────

function scopePupils(pupils: Pupil[], scope: AccessScope): Pupil[] {
  switch (scope.role) {
    case 'slt':     return pupils
    case 'hoy':     return pupils.filter((p) => p.yearGroup === (scope.yearGroup ?? 'Year 6'))
    case 'teacher': return pupils.filter((p) => p.className  === (scope.className  ?? 'Year 6'))
  }
}

// ── Queries (server-side, mock data only) ─────────────────────

export async function getPupils(scope: AccessScope): Promise<Pupil[]> {
  return scopePupils(MOCK_PUPILS, scope)
}

export async function getPupilById(id: string): Promise<Pupil | null> {
  return MOCK_PUPILS.find((p) => p.id === id) ?? null
}

export async function getPriorityPupils(
  scope: AccessScope,
  source: SchoolDataSource = getMockDataSource(),
) {
  const pupils = scopePupils(source.pupils, scope)
  return pupils
    .map((pupil) => ({
      pupil,
      risk:       source.riskProfiles.find((r) => r.pupilId === pupil.id)!,
      attendance: source.attendance.find((a)   => a.pupilId === pupil.id)!,
      behaviour:  source.behaviour.find((b)    => b.pupilId === pupil.id)!,
    }))
    .filter((row) => row.risk?.riskLevel !== 'none' && row.risk?.riskLevel != null)
    .sort((a, b) => (b.risk?.overallScore ?? 0) - (a.risk?.overallScore ?? 0))
}

export async function getDashboardStats(
  scope: AccessScope,
  source: SchoolDataSource = getMockDataSource(),
): Promise<DashboardStats> {
  if (scope.role === 'slt') return source.stats

  const pupils   = scopePupils(source.pupils, scope)
  const ids      = new Set(pupils.map((p) => p.id))
  const attData  = source.attendance.filter((a) => ids.has(a.pupilId))
  const riskData = source.riskProfiles.filter((r) => ids.has(r.pupilId))
  const subjData = source.subjectProfiles.filter((s) => ids.has(s.pupilId))

  return {
    totalPupils:            pupils.length,
    pupilsNeedingAttention: riskData.filter((r) => r.riskLevel === 'high').length,
    attendanceConcerns:     attData.filter((a) => a.overallPct < 90).length,
    behaviourConcerns:      subjData.filter((s) => s.belowExpected.length >= 5).length,
    overallAttendancePct:
      Math.round((attData.reduce((s, a) => s + a.overallPct, 0) / (attData.length || 1)) * 10) / 10,
    lastImportAt: source.stats.lastImportAt,
  }
}

export async function getPupilFullRecord(
  id: string,
  source: SchoolDataSource = getMockDataSource(),
) {
  const pupil = source.pupils.find((p) => p.id === id) ?? null
  if (!pupil) return null
  return {
    pupil,
    attendance:  source.attendance.find((a)      => a.pupilId === id) ?? null,
    behaviour:   source.behaviour.find((b)        => b.pupilId === id) ?? null,
    risk:        source.riskProfiles.find((r)     => r.pupilId === id) ?? null,
    subjects:    source.subjectProfiles.find((s) => s.pupilId === id) ?? null,
  }
}
