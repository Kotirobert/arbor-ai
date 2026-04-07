export type UserRole = 'teacher' | 'hoy' | 'slt'
export type RiskLevel = 'high' | 'medium' | 'low' | 'none'
export type FlagReason = 'persistent_absence' | 'attainment_concern' | 'lateness_pattern' | 'combined_risk'
export type AttainmentBand = 'Pre-Working Towards' | 'Working Towards' | 'Expected' | 'Greater Depth'
export type Subject = 'Reading' | 'Writing' | 'Maths' | 'Science' | 'History' | 'Geography' | 'Computing' | 'Art' | 'Music' | 'PE' | 'RE'
export type YearGroup = 'Reception' | 'Year 1' | 'Year 2' | 'Year 3' | 'Year 4' | 'Year 5' | 'Year 6'

export interface AvatarColor {
  bg:   string
  text: string
}

export interface Pupil {
  id:          string
  firstName:   string
  lastName:    string
  fullName:    string
  initials:    string
  yearGroup:   YearGroup
  className:   string
  dateOfBirth: string
  sex:         'Male' | 'Female'
  avatarColor: AvatarColor
}

export interface AttendanceSummary {
  pupilId:              string
  overallPct:           number
  authorisedAbsences:   number
  unauthorisedAbsences: number
  lateCount:            number
  mondayAbsenceRate:    number
  weeklyTrend:          WeeklyAttendance[]
}

export interface WeeklyAttendance {
  weekLabel: string
  pct:       number
  absences:  number
}

export interface BehaviourSummary {
  pupilId:              string
  totalIncidents:       number
  incidentsLast7Days:   number
  afternoonIncidentPct: number
  typeBreakdown:        Record<string, number>
  weeklyTrend:          WeeklyBehaviour[]
}

export interface WeeklyBehaviour {
  weekLabel: string
  count:     number
}

export interface PastoralFlag {
  reason:      FlagReason
  severity:    'high' | 'medium' | 'low'
  description: string
}

export interface RiskProfile {
  pupilId:     string
  riskLevel:   RiskLevel
  flags:       PastoralFlag[]
  overallScore: number
  generatedAt: string
}

export interface AiSummary {
  pupilId:         string
  narrative:       string
  recommendations: string[]
  generatedAt:     string
  model:           string
}

export interface AiChatResponse {
  query:           string
  response:        string
  relatedPupilIds: string[]
  generatedAt:     string
}

export interface YearGroupStats {
  yearGroup:               YearGroup | string
  totalPupils:             number
  averageAttendancePct:    number
  pupilsBelowThreshold:    number
  pupilsPersistentAbsence: number
  totalBehaviourIncidents: number
}

export interface DashboardStats {
  totalPupils:            number
  pupilsNeedingAttention: number
  attendanceConcerns:     number
  behaviourConcerns:      number
  overallAttendancePct:   number
  lastImportAt:           string
}

export interface UploadResult {
  success:                   boolean
  pupilsImported:            number
  classesImported:           number
  attendanceDaysImported:    number
  behaviourRecordsImported:  number
  errors:                    string[]
  importedAt:                string
}

export interface ApiResponse<T> {
  data:  T
  error: null
}

export interface ApiError {
  data:  null
  error: { code: string; message: string }
}

export type ApiResult<T> = ApiResponse<T> | ApiError

// ── Subject profile (attainment per pupil) ────────────────────
// Exported here so csvParser, queries, and components all share one definition

export interface SubjectProfile {
  pupilId:       string
  subjects:      Record<string, string>
  belowExpected: string[]
}
