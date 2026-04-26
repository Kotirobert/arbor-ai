'use client'

import { useTransition, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { useDashboardConfig } from '@/hooks/useDashboardConfig'
import { CustomiseSidebar } from '@/components/dashboard/CustomiseSidebar'
import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { PriorityPanel } from '@/components/dashboard/PriorityPanel'
import { InsightsPanel } from '@/components/dashboard/InsightsPanel'
import { AiActionsPanel } from '@/components/dashboard/AiActionsPanel'
import { AuditLog } from '@/components/dashboard/AuditLog'
import { SubjectAttainmentPanel } from '@/components/dashboard/SubjectAttainmentPanel'
import { getSchoolData } from '@/lib/schoolStore'
import { getPriorityPupils, getDashboardStats, getMockDataSource } from '@/lib/data/queries'
import type {
  UserRole, DashboardStats, Pupil,
  AttendanceSummary, BehaviourSummary, RiskProfile,
} from '@/types'

// ── Shared types ──────────────────────────────────────────────

export interface PriorityRow {
  pupil:      Pupil
  risk:       RiskProfile
  attendance: AttendanceSummary
  behaviour:  BehaviourSummary
}

export interface InsightItem {
  label:    string
  tag:      string
  tagColor: 'red' | 'amber' | 'blue' | 'green' | 'purple'
  text:     string
}

export interface YearGroupBar {
  label: string
  pct:   number
  pa:    number
}

// ── Props ─────────────────────────────────────────────────────

interface DashboardClientProps {
  role:              UserRole
  yearGroup:         string
  stats:             DashboardStats
  priorityRows:      PriorityRow[]
  yearGroupBars:     YearGroupBar[]
  attInsights:       InsightItem[]
  behInsights:       InsightItem[]
  subjectAttainment: Record<string, { pre: number; wt: number; exp: number; gd: number }>
  aiChips:           string[]
  suggestedPrompts:  string[]
  onOpenSidebar?:    () => void
  editMode?:         boolean
  onToggleEdit?:     () => void
}

// ── Constants ─────────────────────────────────────────────────

const YEAR_GROUPS = [
  'Reception', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6',
]

// ── Component ─────────────────────────────────────────────────

export function DashboardClient({
  role, yearGroup,
  stats: initialStats,
  priorityRows: initialRows,
  yearGroupBars,
  attInsights, behInsights,
  subjectAttainment: initialSubjects,
  aiChips, suggestedPrompts,
  onOpenSidebar,
  editMode: externalEditMode,
  onToggleEdit,
}: DashboardClientProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const { toast } = useToast()

  // ── Live data from uploaded file ──────────────────────────
  const [liveStats,    setLiveStats]    = useState<DashboardStats>(initialStats)
  const [liveRows,     setLiveRows]     = useState<PriorityRow[]>(initialRows)
  const [liveSubjects, setLiveSubjects] = useState(initialSubjects)
  const [liveYgBars,   setLiveYgBars]   = useState<YearGroupBar[]>(yearGroupBars)
  const [dataSource,   setDataSource]   = useState<'mock' | 'uploaded'>('mock')
  const [lastImport,   setLastImport]   = useState<string | null>(null)

  // On mount and role change: check if uploaded data exists
  useEffect(() => {
    const stored = getSchoolData()
    if (!stored || stored.pupils.length === 0) return

    const scope = {
      role,
      yearGroup: role === 'hoy'     ? yearGroup : undefined,
      className: role === 'teacher' ? yearGroup : undefined,
    }

    const source = {
      pupils:          stored.pupils,
      attendance:      stored.attendance,
      behaviour:       stored.behaviour,
      subjectProfiles: stored.subjectProfiles,
      riskProfiles:    stored.riskProfiles,
      stats:           stored.stats,
    }

    // Compute scoped stats
    Promise.all([
      getDashboardStats(scope, source),
      getPriorityPupils(scope, source),
    ]).then(([stats, rows]) => {
      setLiveStats(stats)
      setLiveRows(rows as PriorityRow[])
      setDataSource('uploaded')

      // Rebuild year group attendance bars from uploaded data
      const ygs = [...new Set(stored.pupils.map((p) => p.yearGroup))]
      const bars: YearGroupBar[] = ygs.map((yg) => {
        const pupils = stored.pupils.filter((p) => p.yearGroup === yg)
        const ids    = new Set(pupils.map((p) => p.id))
        const attData = stored.attendance.filter((a) => ids.has(a.pupilId))
        const avg = attData.length
          ? Math.round((attData.reduce((s, a) => s + a.overallPct, 0) / attData.length) * 10) / 10
          : 0
        const pa = attData.filter((a) => a.overallPct < 90).length
        return { label: yg, pct: avg, pa }
      })
      setLiveYgBars(bars)

      // Rebuild subject attainment
      const subjects: Record<string, { pre: number; wt: number; exp: number; gd: number }> = {}
      const BAND_MAP: Record<string, 'pre' | 'wt' | 'exp' | 'gd'> = {
        'Pre-Working Towards': 'pre',
        'Working Towards':     'wt',
        'Expected':            'exp',
        'Greater Depth':       'gd',
      }
      for (const profile of stored.subjectProfiles) {
        for (const [subj, band] of Object.entries(profile.subjects)) {
          if (!subjects[subj]) subjects[subj] = { pre: 0, wt: 0, exp: 0, gd: 0 }
          const key = BAND_MAP[band]
          if (key) subjects[subj][key]++
        }
      }
      if (Object.keys(subjects).length > 0) setLiveSubjects(subjects)

      // Format timestamp
      const ts = new Date(stored.importedAt).toLocaleString('en-GB', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
      })
      setLastImport(ts)
    })
  }, [role, yearGroup])

  // ── Config / edit mode ────────────────────────────────────
  const {
    draft, isDirty, editMode: internalEditMode,
    openEdit, closeEdit, togglePanel, save, reset, isVisible,
  } = useDashboardConfig(role)

  const editMode = externalEditMode ?? internalEditMode

  function handleYearChange(e: React.ChangeEvent<HTMLSelectElement>) {
    startTransition(() => router.push(`/arbor/dashboard?role=${role}&year=${e.target.value}`))
  }
  function handleSave() { save(); toast('Dashboard layout saved', 'success') }
  function handleReset() { reset(); toast('Layout reset to default') }

  const scopeLabel =
    role === 'slt'     ? 'Viewing all year groups — Reception to Year 6' :
    role === 'hoy'     ? `Viewing ${yearGroup}` :
    `Viewing class ${yearGroup}`

  const noContentVisible =
    !isVisible('priorityPupils') && !isVisible('aiActions') &&
    !isVisible('attendanceBars') && !isVisible('attainmentInsights') &&
    !isVisible('subjectAttainment') && !isVisible('auditLog')

  return (
    <main className="app__main" style={{ background: 'var(--paper)', overflowY: 'auto' }}>
    <div className="px-4 pt-6 pb-12 md:px-8 md:pt-8 lg:px-8">
    <div style={{ display: editMode ? 'flex' : 'block', gap: editMode ? 24 : 0, alignItems: 'flex-start' }}>
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 32, flexWrap: 'wrap' }}>
          {onOpenSidebar && (
            <button
              className="flex md:hidden items-center justify-center p-1.5 rounded-md self-start mt-1"
              onClick={onOpenSidebar}
              aria-label="Open sidebar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 6h18M3 12h18M3 18h18"/>
              </svg>
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {dataSource === 'uploaded' && (
              <span className="tag tag--green">
                <span className="tag__dot" />
                Live data
              </span>
            )}

            {role !== 'slt' && (
              <select
                value={yearGroup}
                onChange={handleYearChange}
                className="input"
                style={{ width: 'auto', padding: '8px 14px', fontSize: 13 }}
              >
                {YEAR_GROUPS.map((yg) => <option key={yg} value={yg}>{yg}</option>)}
              </select>
            )}


          </div>
        </div>

        {/* Data source banner when using mock data */}
        {dataSource === 'mock' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 10, background: 'var(--amber-soft)', border: '1px solid var(--amber-line)' }}>
            <p style={{ fontSize: 13, color: 'var(--amber)', margin: 0 }}>
              Showing demo data. Upload a CSV file to see your school&rsquo;s real data.
            </p>
            <button
              onClick={() => router.push('/arbor/upload' as any)}
              style={{ fontSize: 13, fontWeight: 500, color: 'var(--amber)', textDecoration: 'underline', background: 'none', border: 0, cursor: 'pointer', marginLeft: 16, flexShrink: 0 }}
            >
              Upload now →
            </button>
          </div>
        )}

        {/* Summary cards */}
        {isVisible('summaryCards') && <SummaryCards stats={liveStats} />}

        {/* Priority + AI */}
        {(isVisible('priorityPupils') || isVisible('aiActions')) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {isVisible('priorityPupils') && <PriorityPanel rows={liveRows} />}
            {isVisible('aiActions') && <AiActionsPanel chips={aiChips} prompts={suggestedPrompts} />}
          </div>
        )}

        {/* Subject attainment */}
        {role === 'slt' && isVisible('subjectAttainment') && (
          <SubjectAttainmentPanel subjectAttainment={liveSubjects} total={liveStats.totalPupils} />
        )}

        {/* Attendance + insights + audit */}
        {(isVisible('attendanceBars') || isVisible('attainmentInsights') || isVisible('auditLog')) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {isVisible('attendanceBars') && (
              <InsightsPanel
                title="Attendance patterns"
                subtitle="Year-to-date · target 96%"
                insights={attInsights}
                yearGroupBars={liveYgBars}
              />
            )}
            {(isVisible('attainmentInsights') || isVisible('auditLog')) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {isVisible('attainmentInsights') && (
                  <InsightsPanel title="Attainment insights" subtitle="School-wide patterns" insights={behInsights} />
                )}
                {isVisible('auditLog') && <AuditLog />}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {noContentVisible && (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <p style={{ fontWeight: 500, marginBottom: 4 }}>All panels are hidden</p>
            <p style={{ fontSize: 13, color: 'var(--ink-2)' }}>Use the customise panel to turn some back on.</p>
          </div>
        )}
      </div>

      {/* Customise sidebar (inline, alongside content) */}
      {editMode && (
        <CustomiseSidebar
          role={role}
          draft={draft}
          isDirty={isDirty}
          onToggle={togglePanel}
          onSave={handleSave}
          onReset={handleReset}
          onClose={() => { closeEdit(); onToggleEdit?.() }}
        />
      )}
    </div>
    </div>
    </main>
  )
}
