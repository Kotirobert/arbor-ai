'use client'

import { useTransition, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
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
}

// ── Constants ─────────────────────────────────────────────────

const ROLE_STYLES: Record<UserRole, string> = {
  slt:     'bg-brand-50 text-brand-600',
  hoy:     'bg-amber-50 text-amber-700',
  teacher: 'bg-blue-50  text-blue-700',
}

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
    draft, isDirty, editMode,
    openEdit, closeEdit, togglePanel, save, reset, isVisible,
  } = useDashboardConfig(role)

  function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    startTransition(() => router.push(`/dashboard?role=${e.target.value}&year=${yearGroup}`))
  }
  function handleYearChange(e: React.ChangeEvent<HTMLSelectElement>) {
    startTransition(() => router.push(`/dashboard?role=${role}&year=${e.target.value}`))
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
    <div className={cn(
      'max-w-screen-xl mx-auto px-6 py-6',
      editMode ? 'flex gap-6 items-start' : 'block',
    )}>
      <main className="flex-1 min-w-0 space-y-5">

        {/* Top bar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-stone-900">School overview</h1>
              {dataSource === 'uploaded' && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 border border-brand-200">
                  Live data
                </span>
              )}
            </div>
            <p className="text-sm text-stone-400 mt-0.5">
              {scopeLabel}
              {lastImport && (
                <span className="ml-2 text-stone-300">· imported {lastImport}</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {role !== 'slt' && (
              <select
                value={yearGroup}
                onChange={handleYearChange}
                className="text-xs font-medium px-3 py-1.5 rounded-full border border-stone-200 bg-white text-stone-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {YEAR_GROUPS.map((yg) => <option key={yg} value={yg}>{yg}</option>)}
              </select>
            )}

            <select
              value={role}
              onChange={handleRoleChange}
              className={cn(
                'text-xs font-medium px-3 py-1.5 rounded-full border-0 cursor-pointer',
                'focus:outline-none focus:ring-2 focus:ring-brand-500',
                ROLE_STYLES[role],
              )}
            >
              <option value="slt">Role: Headteacher</option>
              <option value="hoy">Role: Year Lead</option>
              <option value="teacher">Role: Class Teacher</option>
            </select>

            <button
              onClick={() => router.push('/upload')}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 transition-colors"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
              {dataSource === 'uploaded' ? 'Re-upload' : 'Upload data'}
            </button>

            <button
              onClick={editMode ? closeEdit : openEdit}
              className={cn(
                'inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-150',
                editMode
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300 hover:bg-stone-50',
              )}
            >
              {editMode ? (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  Exit customise
                </>
              ) : (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  Customise
                </>
              )}
            </button>
          </div>
        </div>

        {/* Data source banner when using mock data */}
        {dataSource === 'mock' && (
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
            <p className="text-xs text-amber-700">
              Showing demo data. Upload a CSV file to see your school's real data.
            </p>
            <button
              onClick={() => router.push('/upload')}
              className="text-xs font-medium text-amber-700 underline hover:no-underline ml-4 flex-shrink-0"
            >
              Upload now →
            </button>
          </div>
        )}

        {/* Summary cards */}
        {isVisible('summaryCards') && <SummaryCards stats={liveStats} />}

        {/* Priority + AI */}
        {(isVisible('priorityPupils') || isVisible('aiActions')) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {isVisible('attendanceBars') && (
              <InsightsPanel
                title="Attendance patterns"
                subtitle="Year-to-date · target 96%"
                insights={attInsights}
                yearGroupBars={liveYgBars}
              />
            )}
            {(isVisible('attainmentInsights') || isVisible('auditLog')) && (
              <div className="space-y-5">
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
          <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center">
            <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center mx-auto mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-stone-700 mb-1">All panels are hidden</p>
            <p className="text-xs text-stone-400">Use the customise panel to turn some back on.</p>
          </div>
        )}
      </main>

      {/* Customise sidebar */}
      {editMode && (
        <CustomiseSidebar
          role={role}
          draft={draft}
          isDirty={isDirty}
          onToggle={togglePanel}
          onSave={handleSave}
          onReset={handleReset}
          onClose={closeEdit}
        />
      )}
    </div>
  )
}
