import type { UserRole } from '@/types'

// ── Panel IDs ─────────────────────────────────────────────────
// Each string is a stable key used in both the config and the UI.

export const PANEL_IDS = [
  'summaryCards',
  'priorityPupils',
  'aiActions',
  'attendanceBars',
  'attainmentInsights',
  'subjectAttainment',
  'auditLog',
] as const

export type PanelId = (typeof PANEL_IDS)[number]

// ── Panel metadata ────────────────────────────────────────────
// Used to render the sidebar toggle list.

export interface PanelMeta {
  id:          PanelId
  label:       string
  description: string
  section:     'summary' | 'pastoral' | 'attendance' | 'attainment'
  /** Roles that are allowed to see this panel at all */
  roles:       UserRole[]
  /** Cannot be hidden */
  required?:   boolean
}

export const PANEL_META: PanelMeta[] = [
  {
    id: 'summaryCards',
    label: 'Summary cards',
    description: 'Total pupils, attendance, concerns',
    section: 'summary',
    roles: ['slt', 'hoy', 'teacher'],
    required: true,
  },
  {
    id: 'priorityPupils',
    label: 'Priority pupils',
    description: 'Persistent absence + attainment flags',
    section: 'pastoral',
    roles: ['slt', 'hoy', 'teacher'],
  },
  {
    id: 'aiActions',
    label: 'AI actions & chat',
    description: 'Quick insights and natural language queries',
    section: 'pastoral',
    roles: ['slt', 'hoy', 'teacher'],
  },
  {
    id: 'attendanceBars',
    label: 'Attendance by year group',
    description: 'Year-to-date attendance bars',
    section: 'attendance',
    roles: ['slt', 'hoy'],
  },
  {
    id: 'attainmentInsights',
    label: 'Attainment insights',
    description: 'Written pattern summaries',
    section: 'attainment',
    roles: ['slt', 'hoy', 'teacher'],
  },
  {
    id: 'subjectAttainment',
    label: 'Subject attainment',
    description: 'All 11 subjects — band breakdown',
    section: 'attainment',
    roles: ['slt'],
  },
  {
    id: 'auditLog',
    label: 'Audit log',
    description: 'Recent system activity',
    section: 'attainment',
    roles: ['slt', 'hoy'],
  },
]

// ── Config type ───────────────────────────────────────────────

export type DashboardConfig = Record<PanelId, boolean>

// ── Defaults: all panels on ───────────────────────────────────

export const DEFAULT_CONFIG: DashboardConfig = {
  summaryCards:       true,
  priorityPupils:     true,
  aiActions:          true,
  attendanceBars:     true,
  attainmentInsights: true,
  subjectAttainment:  true,
  auditLog:           true,
}

// ── Storage key ───────────────────────────────────────────────

function storageKey(role: UserRole) {
  return `arbor-dashboard-config-${role}`
}

// ── Load / save ───────────────────────────────────────────────

export function loadConfig(role: UserRole): DashboardConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG
  try {
    const raw = localStorage.getItem(storageKey(role))
    if (!raw) return { ...DEFAULT_CONFIG }
    const parsed = JSON.parse(raw) as Partial<DashboardConfig>
    // Merge with defaults so new panels added later appear as on
    return { ...DEFAULT_CONFIG, ...parsed }
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

export function saveConfig(role: UserRole, config: DashboardConfig): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(storageKey(role), JSON.stringify(config))
  } catch {
    // Storage full or unavailable — fail silently
  }
}

export function resetConfig(role: UserRole): DashboardConfig {
  if (typeof window === 'undefined') return { ...DEFAULT_CONFIG }
  try {
    localStorage.removeItem(storageKey(role))
  } catch { /* empty */ }
  return { ...DEFAULT_CONFIG }
}

// ── Section labels ────────────────────────────────────────────

export const SECTION_LABELS: Record<PanelMeta['section'], string> = {
  summary:     'Summary',
  pastoral:    'Pastoral',
  attendance:  'Attendance',
  attainment:  'Attainment',
}
