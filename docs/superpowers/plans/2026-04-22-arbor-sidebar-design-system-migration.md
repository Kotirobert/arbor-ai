# Arbor Sidebar + Design System Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Arbor AI the same sidebar shell ChalkAI has, remove the `ArborToolbar` that causes a layout jump, and migrate all remaining Arbor pages from old Tailwind utility classes to the project's CSS token design system.

**Architecture:** Create a standalone `ArborSidebar` client component that mirrors the ChalkAI sidebar pattern; extract the sidebar already embedded in `DashboardClient` into this new component; wrap each Arbor page in the `.app` shell with the sidebar alongside the page content. Upload and pupil-detail pages are rewritten to use inline styles with CSS tokens exclusively.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, CSS custom properties (`globals.css`), `next/navigation` hooks

---

## File map

| Status | File | What changes |
|--------|------|-------------|
| **Create** | `components/arbor/ArborSidebar.tsx` | New standalone sidebar for all Arbor pages |
| **Modify** | `components/dashboard/DashboardClient.tsx` | Remove embedded sidebar + `.app` shell; fix `/dashboard?` → `/arbor/dashboard?` routing bug; remove `ROLE_STYLES`, `getMockSession`, `session`, `initials` |
| **Modify** | `components/ui/Skeleton.tsx` | Wrap `SkeletonDashboard` in `<main className="app__main">` to prevent layout shift during Suspense |
| **Modify** | `app/(platform)/arbor/dashboard/page.tsx` | Remove `ArborToolbar`; add `.app` wrapper + `<ArborSidebar>` |
| **Modify** | `app/(platform)/arbor/upload/page.tsx` | Add `.app` wrapper + `<ArborSidebar>`; full Tailwind → CSS token migration |
| **Modify** | `app/(platform)/arbor/pupil/[id]/page.tsx` | Add `.app` wrapper + `<ArborSidebar>`; replace old header with breadcrumb topbar |
| **Delete** | `components/arbor/ArborToolbar.tsx` | No longer imported anywhere |

---

## Task 1: Create `ArborSidebar`

**Files:**
- Create: `components/arbor/ArborSidebar.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { getSession } from '@/lib/auth/mockSession'
import type { UserRole } from '@/types'

interface ArborSidebarProps {
  role:       UserRole
  schoolName: string
  lastUpload: string
}

export function ArborSidebar({ role, schoolName, lastUpload }: ArborSidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const search   = useSearchParams()
  const session  = typeof window !== 'undefined' ? getSession() : null
  const initials = session
    ? `${session.firstName?.[0] ?? ''}${session.lastName?.[0] ?? ''}`.toUpperCase() || 'AR'
    : 'AR'

  function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const p = new URLSearchParams(search?.toString() ?? '')
    p.set('role', e.target.value)
    router.push(`/arbor/dashboard?${p.toString()}`)
  }

  const isDashboard = pathname === '/arbor/dashboard' || (pathname?.startsWith('/arbor/pupil') ?? false)
  const isUpload    = pathname === '/arbor/upload'

  return (
    <aside className="app__sidebar">
      {/* Brand + school info */}
      <div>
        <div className="nav__brand" style={{ fontSize: 22 }}>
          <span className="nav__brand-mark" />
          <span>Arbor AI</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4, paddingLeft: 30, lineHeight: 1.4 }}>
          {schoolName} · {lastUpload}
        </div>
      </div>

      {/* Tool switcher */}
      <div className="tool-switch">
        <button className="tool-switch__btn tool-switch__btn--active">
          <svg className="ico" style={{ width: 13, height: 13 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/>
          </svg>
          Arbor AI
        </button>
        <Link href="/chalkai" className="tool-switch__btn">
          <svg className="ico" style={{ width: 13, height: 13 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21v-5l9-9 5 5-9 9H3z"/><path d="M12 7l5 5"/>
          </svg>
          ChalkAI
        </Link>
      </div>

      {/* Workspace nav */}
      <div className="side-group">
        <div className="side-group__title">Workspace</div>
        <Link
          href="/arbor/dashboard"
          className={`side-link${isDashboard ? ' side-link--active' : ''}`}
        >
          <svg className="ico side-link__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/>
          </svg>
          Dashboard
        </Link>
        <Link
          href="/arbor/upload"
          className={`side-link${isUpload ? ' side-link--active' : ''}`}
        >
          <svg className="ico side-link__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
          </svg>
          Upload data
        </Link>
      </div>

      {/* View as */}
      <div className="side-group">
        <div className="side-group__title">View as</div>
        <div style={{ paddingLeft: 4, paddingRight: 4 }}>
          <select
            value={role}
            onChange={handleRoleChange}
            style={{
              width: '100%', padding: '8px 10px',
              border: '1px solid var(--line-2)', borderRadius: 6,
              fontSize: 12.5, fontFamily: 'var(--f-body)',
              background: 'var(--paper)', color: 'var(--ink)', cursor: 'pointer',
              appearance: 'auto',
            }}
          >
            <option value="slt">Headteacher / SLT</option>
            <option value="hoy">Head of Year</option>
            <option value="teacher">Class Teacher</option>
          </select>
        </div>
      </div>

      {/* User meta */}
      <div className="side-meta">
        <div className="avatar">{initials}</div>
        <div>
          <div style={{ fontWeight: 500 }}>
            {session ? `${session.firstName} ${session.lastName}`.trim() : 'School lead'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>Arbor AI</div>
        </div>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "/Users/kotirobert/websites/arbor ai/.claude/worktrees/pensive-albattani-bf3efc" && npx tsc --noEmit 2>&1 | grep ArborSidebar
```

Expected: no output (no errors for this file).

- [ ] **Step 3: Commit**

```bash
cd "/Users/kotirobert/websites/arbor ai/.claude/worktrees/pensive-albattani-bf3efc"
git add components/arbor/ArborSidebar.tsx
git commit -m "feat: add ArborSidebar component"
```

---

## Task 2: Refactor `DashboardClient` — remove embedded sidebar

**Files:**
- Modify: `components/dashboard/DashboardClient.tsx`

The current `DashboardClient` wraps everything in `<div className="app">` and renders its own sidebar. This task strips the `.app` shell and sidebar so the component returns only `<main className="app__main">`.

- [ ] **Step 1: Remove unused imports and constants**

Remove these lines at the top of the file:

```diff
- import Link from 'next/link'
- import { getSession as getMockSession } from '@/lib/auth/mockSession'
```

Remove the `ROLE_STYLES` constant (lines 63-67):

```diff
- const ROLE_STYLES: Record<UserRole, string> = {
-   slt:     'bg-brand-50 text-brand-600',
-   hoy:     'bg-amber-50 text-amber-700',
-   teacher: 'bg-blue-50  text-blue-700',
- }
```

- [ ] **Step 2: Remove session/initials variables**

Remove these two lines from inside the component body (currently around line 189-190):

```diff
-  const session = typeof window !== 'undefined' ? getMockSession() : null
-  const initials = session ? `${session.firstName?.[0] ?? ''}${session.lastName?.[0] ?? ''}`.toUpperCase() || 'TC' : 'TC'
```

- [ ] **Step 3: Fix the role-change routing bug**

The current `handleRoleChange` navigates to `/dashboard?role=...` — the wrong path. Fix it:

```diff
- startTransition(() => router.push(`/dashboard?role=${e.target.value}&year=${yearGroup}`))
+ startTransition(() => router.push(`/arbor/dashboard?role=${e.target.value}&year=${yearGroup}`))
```

- [ ] **Step 4: Replace the return statement**

The component currently returns `<div className="app">` containing `<aside>` and `<main>`. Replace the entire return with just the `<main>` content. The new return should look like this:

```tsx
  return (
    <main className="app__main" style={{ background: 'var(--paper)', overflowY: 'auto' }}>
    <div style={{ padding: '32px 32px 48px' }}>
    <div className={cn(editMode ? 'flex gap-6 items-start' : 'block')}>
    <div className="flex-1 min-w-0 space-y-5">

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 32, flexWrap: 'wrap' }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Arbor AI · School overview</div>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 44, lineHeight: 1.05, letterSpacing: '-0.02em', margin: 0 }}>
            A calm view of your <i style={{ color: 'var(--chalk-green)' }}>school, today.</i>
          </h1>
          <p style={{ color: 'var(--ink-2)', fontSize: 14, marginTop: 10 }}>
            {scopeLabel}
            {lastImport && <span style={{ color: 'var(--ink-3)' }}> · imported {lastImport}</span>}
          </p>
        </div>

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

          <button
            onClick={() => router.push('/arbor/upload' as any)}
            className="btn btn--ghost btn--sm"
          >
            <svg className="ico" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
            </svg>
            {dataSource === 'uploaded' ? 'Re-upload' : 'Upload data'}
          </button>

          <button
            onClick={editMode ? closeEdit : openEdit}
            className={`btn btn--sm ${editMode ? 'btn--primary' : 'btn--ghost'}`}
          >
            {editMode ? 'Exit customise' : 'Customise'}
          </button>
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
        onClose={closeEdit}
      />
    )}
    </div>
    </div>
    </main>
  )
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd "/Users/kotirobert/websites/arbor ai/.claude/worktrees/pensive-albattani-bf3efc" && npx tsc --noEmit 2>&1 | grep -E "DashboardClient|error" | head -20
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
cd "/Users/kotirobert/websites/arbor ai/.claude/worktrees/pensive-albattani-bf3efc"
git add components/dashboard/DashboardClient.tsx
git commit -m "refactor: extract sidebar from DashboardClient, fix role-change route"
```

---

## Task 3: Update `SkeletonDashboard` for new layout

**Files:**
- Modify: `components/ui/Skeleton.tsx`

`SkeletonDashboard` is the Suspense fallback for the dashboard. Now that `DashboardClient` returns `<main className="app__main">`, the skeleton must also return `<main className="app__main">` — otherwise the sidebar will be invisible during loading.

- [ ] **Step 1: Wrap `SkeletonDashboard` in `app__main`**

Replace the current `SkeletonDashboard` function:

```tsx
export function SkeletonDashboard() {
  return (
    <main className="app__main" style={{ background: 'var(--paper)', overflowY: 'auto' }}>
      <div style={{ padding: '32px 32px 48px' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ width: 160, height: 12, background: 'var(--line-2)', borderRadius: 6, marginBottom: 14 }} />
          <div style={{ width: 320, height: 36, background: 'var(--line)', borderRadius: 6 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: 20, background: 'var(--paper-2)' }}>
              <div style={{ width: 60, height: 10, background: 'var(--line-2)', borderRadius: 4, marginBottom: 12 }} />
              <div style={{ width: 48, height: 28, background: 'var(--line)', borderRadius: 4, marginBottom: 8 }} />
              <div style={{ width: 80, height: 9, background: 'var(--line-2)', borderRadius: 4 }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {[5, 3].map((rows, i) => (
            <div key={i} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: 20, background: 'var(--paper-2)' }}>
              <div style={{ width: 120, height: 11, background: 'var(--line-2)', borderRadius: 4, marginBottom: 16 }} />
              {Array.from({ length: rows }).map((_, j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: j === 0 ? 'none' : '1px solid var(--line)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--line-2)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ width: 120, height: 10, background: 'var(--line-2)', borderRadius: 4, marginBottom: 6 }} />
                    <div style={{ width: 80, height: 8, background: 'var(--line)', borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd "/Users/kotirobert/websites/arbor ai/.claude/worktrees/pensive-albattani-bf3efc"
git add components/ui/Skeleton.tsx
git commit -m "fix: wrap SkeletonDashboard in app__main for sidebar layout"
```

---

## Task 4: Update dashboard page

**Files:**
- Modify: `app/(platform)/arbor/dashboard/page.tsx`

- [ ] **Step 1: Replace the file content**

```tsx
import { Suspense } from 'react'
import { getDashboardStats, getPriorityPupils } from '@/lib/data/queries'
import {
  ATTENDANCE_INSIGHTS,
  BEHAVIOUR_INSIGHTS,
  YEAR_GROUP_ATTENDANCE_BARS,
  MOCK_SUBJECT_ATTAINMENT,
  MOCK_DASHBOARD_STATS,
} from '@/lib/data/mock'
import { AI_ACTION_CHIPS, SUGGESTED_PROMPTS } from '@/lib/ai'
import { ArborSidebar } from '@/components/arbor/ArborSidebar'
import { SkeletonDashboard } from '@/components/ui/Skeleton'
import { DashboardClient } from '@/components/dashboard/DashboardClient'
import type { UserRole } from '@/types'

interface DashboardPageProps {
  searchParams: Promise<{ role?: string; year?: string }>
}

const VALID_ROLES: UserRole[] = ['slt', 'hoy', 'teacher']
const YEAR_GROUPS = ['Reception', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6']

export default async function ArborDashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams
  const role: UserRole = VALID_ROLES.includes(params.role as UserRole)
    ? (params.role as UserRole)
    : 'slt'

  const yearGroup = YEAR_GROUPS.includes(params.year ?? '') ? params.year : 'Year 6'

  const scope = {
    role,
    yearGroup: role === 'hoy'     ? yearGroup : undefined,
    className: role === 'teacher' ? yearGroup : undefined,
  }

  const [stats, priorityRows] = await Promise.all([
    getDashboardStats(scope),
    getPriorityPupils(scope),
  ])

  const lastImport = new Date(MOCK_DASHBOARD_STATS.lastImportAt).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="app">
      <ArborSidebar
        role={role}
        schoolName="Greenfield Primary School"
        lastUpload={lastImport}
      />
      <Suspense fallback={<SkeletonDashboard />}>
        <DashboardClient
          role={role}
          yearGroup={yearGroup ?? 'Year 6'}
          stats={stats}
          priorityRows={priorityRows}
          yearGroupBars={YEAR_GROUP_ATTENDANCE_BARS}
          attInsights={ATTENDANCE_INSIGHTS}
          behInsights={BEHAVIOUR_INSIGHTS}
          subjectAttainment={MOCK_SUBJECT_ATTAINMENT}
          aiChips={AI_ACTION_CHIPS[role] ?? AI_ACTION_CHIPS.slt}
          suggestedPrompts={SUGGESTED_PROMPTS}
        />
      </Suspense>
    </div>
  )
}
```

- [ ] **Step 2: Run build to check**

```bash
cd "/Users/kotirobert/websites/arbor ai/.claude/worktrees/pensive-albattani-bf3efc" && npm run build 2>&1 | tail -20
```

Expected: `✓ Generating static pages` with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
cd "/Users/kotirobert/websites/arbor ai/.claude/worktrees/pensive-albattani-bf3efc"
git add app/\(platform\)/arbor/dashboard/page.tsx
git commit -m "feat: add ArborSidebar to dashboard page, remove ArborToolbar"
```

---

## Task 5: Migrate upload page

**Files:**
- Modify: `app/(platform)/arbor/upload/page.tsx`

Full rewrite — same logic, all Tailwind classes replaced with inline CSS token styles. The `cn()` utility, `bg-brand-*`, `bg-stone-*`, `text-stone-*`, `border-stone-*`, `rounded-*`, `shadow-*` classes are removed entirely.

- [ ] **Step 1: Replace the entire file**

```tsx
'use client'

import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { storeSchoolData } from '@/lib/schoolStore'
import { ArborSidebar } from '@/components/arbor/ArborSidebar'
import type { ParsedSchoolData } from '@/lib/csvParser'
import type { SubjectProfile } from '@/types'

type UploadState = 'idle' | 'uploading' | 'success' | 'error'

interface UploadStats {
  pupils:            number
  yearGroups:        number
  persistentAbsence: number
  avgAttendance:     number
  subjects:          number
}

interface FileUploadResult {
  success:    boolean
  data:       ParsedSchoolData
  stats:      UploadStats
  warnings:   string[]
  importedAt: string
}

const STEPS = [
  'Reading file structure...',
  'Detecting CSV format...',
  'Parsing pupil records...',
  'Computing attendance summaries...',
  'Building attainment profiles...',
  'Computing risk scores...',
  'Generating dashboard insights...',
]

function mergeResults(results: FileUploadResult[]): { merged: ParsedSchoolData; stats: UploadStats; allWarnings: string[] } {
  const pupils      = [...new Map(results.flatMap(r => r.data.pupils).map(p => [p.id, p])).values()]
  const attendance  = [...new Map(results.flatMap(r => r.data.attendance).map(a => [a.pupilId, a])).values()]
  const behaviour   = [...new Map(results.flatMap(r => r.data.behaviour).map(b => [b.pupilId, b])).values()]
  const riskProfiles = [...new Map(results.flatMap(r => r.data.riskProfiles).map(rp => [rp.pupilId, rp])).values()]
  const allWarnings = results.flatMap(r => r.warnings ?? [])

  const subjMap = new Map<string, SubjectProfile>()
  for (const r of results) {
    for (const sp of r.data.subjectProfiles) {
      const existing = subjMap.get(sp.pupilId)
      if (existing) {
        const merged = { ...existing.subjects, ...sp.subjects }
        subjMap.set(sp.pupilId, {
          pupilId:       sp.pupilId,
          subjects:      merged,
          belowExpected: Object.entries(merged)
            .filter(([, band]) => band === 'Working Towards' || band === 'Pre-Working Towards')
            .map(([subj]) => subj),
        })
      } else {
        subjMap.set(sp.pupilId, { ...sp })
      }
    }
  }
  const subjectProfiles = [...subjMap.values()]

  const avgAttendance = attendance.length > 0
    ? attendance.reduce((sum, a) => sum + a.overallPct, 0) / attendance.length
    : 0

  const merged: ParsedSchoolData = {
    pupils,
    attendance,
    behaviour,
    subjectProfiles,
    riskProfiles,
    stats: {
      totalPupils:            pupils.length,
      pupilsNeedingAttention: riskProfiles.filter(rp => rp.riskLevel === 'high').length,
      attendanceConcerns:     attendance.filter(a => a.overallPct < 90).length,
      behaviourConcerns:      behaviour.filter(b => b.totalIncidents > 0).length,
      overallAttendancePct:   avgAttendance,
      lastImportAt:           new Date().toISOString(),
    },
    importedAt:   new Date().toISOString(),
    sourceFormat: results[0]?.data.sourceFormat ?? 'unknown',
    warnings:     allWarnings,
  }

  const stats: UploadStats = {
    pupils:            pupils.length,
    yearGroups:        [...new Set(pupils.map(p => p.yearGroup))].length,
    persistentAbsence: attendance.filter(a => a.overallPct < 90).length,
    avgAttendance,
    subjects:          Object.keys(subjectProfiles[0]?.subjects ?? {}).length,
  }

  return { merged, stats, allWarnings }
}

export default function ArborUploadPage() {
  const router  = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [state,            setState]          = useState<UploadState>('idle')
  const [isDragging,       setIsDragging]     = useState(false)
  const [selectedFiles,    setSelectedFiles]  = useState<File[]>([])
  const [stepIndex,        setStepIndex]      = useState(-1)
  const [currentFileIndex, setCurrentFileIdx] = useState(0)
  const [result,           setResult]         = useState<{ stats: UploadStats } | null>(null)
  const [errorMessage,     setErrorMessage]   = useState('')
  const [warnings,         setWarnings]       = useState<string[]>([])

  function validateFile(file: File): string | null {
    const name = file.name.toLowerCase()
    if (!name.endsWith('.csv') && !name.endsWith('.txt'))
      return `${file.name}: only CSV files are supported.`
    if (file.size > 10 * 1024 * 1024)
      return `${file.name}: file is too large (max 10 MB).`
    if (file.size < 50)
      return `${file.name}: file appears to be empty.`
    return null
  }

  function addFiles(incoming: File[]) {
    const errors: string[] = []
    const valid: File[] = []
    for (const file of incoming) {
      const err = validateFile(file)
      if (err) errors.push(err)
      else valid.push(file)
    }
    if (errors.length) { setErrorMessage(errors.join('\n')); setState('error') }
    else { setState('idle'); setErrorMessage('') }
    if (valid.length) {
      setSelectedFiles(prev => {
        const existing = new Set(prev.map(f => f.name + f.size))
        return [...prev, ...valid.filter(f => !existing.has(f.name + f.size))]
      })
    }
  }

  function removeFile(index: number) {
    const next = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(next)
    if (next.length === 0) { setState('idle'); setErrorMessage('') }
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) addFiles(Array.from(e.target.files))
  }

  function handleDragOver(e: DragEvent)  { e.preventDefault(); setIsDragging(true) }
  function handleDragLeave(e: DragEvent) { e.preventDefault(); setIsDragging(false) }
  function handleDrop(e: DragEvent) {
    e.preventDefault(); setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length) addFiles(files)
  }

  const runUpload = useCallback(async (files: File[]) => {
    setState('uploading'); setStepIndex(0); setCurrentFileIdx(0)
    setErrorMessage(''); setWarnings([])

    const results: FileUploadResult[] = []
    const skipped: { name: string; error: string }[] = []

    for (let i = 0; i < files.length; i++) {
      setCurrentFileIdx(i); setStepIndex(0)
      let currentStep = 0
      const stepInterval = setInterval(() => {
        currentStep++
        if (currentStep < STEPS.length - 1) setStepIndex(currentStep)
      }, 380)

      try {
        const formData = new FormData()
        formData.append('file', files[i])
        const res  = await fetch('/api/upload', { method: 'POST', body: formData })
        const json = await res.json() as FileUploadResult & { error?: string; warnings?: string[] }
        clearInterval(stepInterval); setStepIndex(STEPS.length - 1)
        if (!res.ok || !json.success) skipped.push({ name: files[i].name, error: json.error ?? 'Upload failed.' })
        else results.push(json)
      } catch {
        clearInterval(stepInterval)
        setErrorMessage('Network error — check your connection and try again.')
        setState('error'); return
      }
      await new Promise<void>((resolve) => setTimeout(resolve, 200))
    }

    if (results.length === 0) {
      setErrorMessage(skipped.map((s) => `${s.name}: ${s.error}`).join('\n'))
      setState('error'); return
    }

    const { merged, stats, allWarnings } = mergeResults(results)
    storeSchoolData(merged)
    const skipWarnings = skipped.map((s) => `Skipped "${s.name}": ${s.error}`)
    if (allWarnings.length || skipWarnings.length) setWarnings([...allWarnings, ...skipWarnings])
    await new Promise<void>((resolve) => setTimeout(resolve, 300))
    setResult({ stats }); setState('success')
  }, [])

  function handleUploadClick() {
    if (selectedFiles.length) runUpload(selectedFiles)
    else fileRef.current?.click()
  }

  function handleReset() {
    setState('idle'); setSelectedFiles([]); setResult(null)
    setErrorMessage(''); setWarnings([]); setStepIndex(-1); setCurrentFileIdx(0)
    if (fileRef.current) fileRef.current.value = ''
  }

  const hasFiles = selectedFiles.length > 0

  return (
    <div className="app">
      <ArborSidebar role="slt" schoolName="Greenfield Primary School" lastUpload="—" />
      <main className="app__main" style={{ overflowY: 'auto', background: 'var(--paper-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', minHeight: '100%' }}>
          <div style={{ width: '100%', maxWidth: 540 }}>

            <div style={{ marginBottom: 32, textAlign: 'center' }}>
              <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 36, letterSpacing: '-0.02em', margin: '0 0 10px', color: 'var(--ink)' }}>
                Import school data
              </h1>
              <p style={{ color: 'var(--ink-2)', fontSize: 14, maxWidth: '38ch', margin: '0 auto', lineHeight: 1.6 }}>
                Upload one or more CSV exports from Arbor MIS. Records are merged across files.
                Your data stays in your browser and is never stored on our servers.
              </p>
            </div>

            <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 12, padding: 32 }}>

              {(state === 'idle' || state === 'error') && (
                <>
                  {/* Drop zone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => !hasFiles && fileRef.current?.click()}
                    style={{
                      border: `2px dashed ${isDragging || hasFiles ? 'var(--chalk-green-line)' : 'var(--line-2)'}`,
                      borderRadius: 10,
                      background: isDragging || hasFiles ? 'var(--chalk-green-soft)' : 'var(--paper-2)',
                      padding: '32px 24px',
                      textAlign: 'center',
                      cursor: hasFiles ? 'default' : 'pointer',
                      transition: 'all 0.2s',
                      marginBottom: 20,
                    }}
                  >
                    <input
                      ref={fileRef} type="file" accept=".csv,.txt" multiple
                      style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
                      onChange={handleInputChange}
                    />
                    <div style={{
                      width: 44, height: 44, borderRadius: 10,
                      border: '1px solid var(--line)',
                      background: hasFiles ? 'var(--chalk-green-soft)' : 'var(--paper)',
                      margin: '0 auto 16px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {hasFiles ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--chalk-green)" strokeWidth="2" strokeLinecap="round">
                          <path d="M5 13l4 4L19 7"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M7 16a4 4 0 01-.88-7.9A5 5 0 1115.9 6h.1a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                        </svg>
                      )}
                    </div>
                    {hasFiles ? (
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--chalk-green)' }}>
                          {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} ready to upload
                        </p>
                        <button
                          onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }}
                          style={{ fontSize: 12, color: 'var(--ink-3)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}
                        >
                          + Add more files
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>Drop CSV files here</p>
                        <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>or click to browse — multiple files supported</p>
                      </div>
                    )}
                  </div>

                  {/* Selected file list */}
                  {selectedFiles.length > 0 && (
                    <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {selectedFiles.map((file, i) => (
                        <div key={file.name + i} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '8px 12px', border: '1px solid var(--line)',
                          borderRadius: 8, background: 'var(--paper-2)',
                        }}>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
                            <p style={{ fontSize: 11, color: 'var(--ink-3)' }}>{(file.size / 1024).toFixed(0)} KB</p>
                          </div>
                          <button
                            onClick={() => removeFile(i)}
                            style={{ marginLeft: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', flexShrink: 0 }}
                            aria-label={`Remove ${file.name}`}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                              <path d="M18 6L6 18M6 6l12 12"/>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Error message */}
                  {state === 'error' && errorMessage && (
                    <div style={{ marginBottom: 16, padding: '12px 16px', border: '1px solid var(--red)', borderRadius: 10, background: 'var(--red-soft)' }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--red)', marginBottom: 2 }}>Upload failed</p>
                      <p style={{ fontSize: 12, color: 'var(--red)', whiteSpace: 'pre-line' }}>{errorMessage}</p>
                    </div>
                  )}

                  {/* Warnings */}
                  {warnings.length > 0 && (
                    <div style={{ marginBottom: 16, padding: '12px 16px', border: '1px solid var(--amber-line)', borderRadius: 10, background: 'var(--amber-soft)' }}>
                      {warnings.map((w, i) => <p key={i} style={{ fontSize: 12, color: 'var(--amber)' }}>{w}</p>)}
                    </div>
                  )}

                  {/* Format tags */}
                  <div style={{ marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {['Pupil export (CSV)', 'Attendance data', 'Arbor MIS export', 'Excel → Save as CSV'].map(t => (
                      <span key={t} className="tag">{t}</span>
                    ))}
                  </div>

                  {/* Upload button */}
                  <button
                    onClick={handleUploadClick}
                    className={`btn btn--block btn--lg${hasFiles ? ' btn--primary' : ''}`}
                    style={!hasFiles ? { background: 'var(--paper-2)', color: 'var(--ink-2)', border: '1px solid var(--line)' } : {}}
                  >
                    {hasFiles
                      ? selectedFiles.length === 1
                        ? 'Upload and process →'
                        : `Upload ${selectedFiles.length} files and process →`
                      : 'Choose files to upload'}
                  </button>

                  <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink-3)', marginTop: 12, lineHeight: 1.6 }}>
                    Data is processed in your browser and stored only in your current session.<br />
                    No pupil data is sent to any third-party server.
                  </p>
                </>
              )}

              {/* Uploading */}
              {state === 'uploading' && (
                <div style={{ padding: '16px 0', textAlign: 'center' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    border: '3px solid var(--line-2)', borderTopColor: 'var(--chalk-green)',
                    animation: 'spin 0.8s linear infinite', margin: '0 auto 20px',
                  }} />
                  <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)', marginBottom: 4 }}>Processing your data</p>
                  <p style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 24 }}>
                    {selectedFiles.length > 1
                      ? `File ${currentFileIndex + 1} of ${selectedFiles.length} — ${selectedFiles[currentFileIndex]?.name ?? ''}`
                      : 'Analysing pupil records…'}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
                    {STEPS.map((step, i) => {
                      const done    = i < stepIndex
                      const current = i === stepIndex
                      return (
                        <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, transition: 'all 0.3s', color: done ? 'var(--chalk-green)' : current ? 'var(--ink)' : 'var(--ink-3)' }}>
                          {done ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--chalk-green)" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
                              <path d="M5 13l4 4L19 7"/>
                            </svg>
                          ) : (
                            <div style={{
                              width: 16, height: 16, borderRadius: '50%',
                              border: `2px solid ${current ? 'var(--chalk-green)' : 'var(--line-2)'}`,
                              borderTopColor: current ? 'transparent' : 'var(--line-2)',
                              animation: current ? 'spin 0.8s linear infinite' : 'none',
                              flexShrink: 0,
                            }} />
                          )}
                          {step}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Success */}
              {state === 'success' && result && (
                <div>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    border: '1px solid var(--chalk-green-line)', background: 'var(--chalk-green-soft)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--chalk-green)" strokeWidth="2" strokeLinecap="round">
                      <path d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                  <h2 style={{ textAlign: 'center', fontFamily: 'var(--f-display)', fontSize: 28, fontWeight: 400, color: 'var(--ink)', marginBottom: 6 }}>
                    Upload complete
                  </h2>
                  <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink-2)', marginBottom: 24 }}>
                    {result.stats.pupils} pupils across {result.stats.yearGroups} year groups processed.
                    {selectedFiles.length > 1 && ` (${selectedFiles.length} files merged)`}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                    <StatBox value={result.stats.pupils} label="Pupils imported" />
                    <StatBox value={result.stats.yearGroups} label="Year groups" />
                    <StatBox
                      value={`${result.stats.avgAttendance.toFixed(1)}%`}
                      label="Average attendance"
                      highlight={result.stats.avgAttendance < 90 ? 'red' : result.stats.avgAttendance < 95 ? 'amber' : 'green'}
                    />
                    <StatBox
                      value={result.stats.persistentAbsence}
                      label="Persistent absence"
                      highlight={result.stats.persistentAbsence > 0 ? 'amber' : 'green'}
                    />
                  </div>

                  {warnings.length > 0 && (
                    <div style={{ marginBottom: 16, padding: '12px 16px', border: '1px solid var(--amber-line)', borderRadius: 10, background: 'var(--amber-soft)' }}>
                      <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--amber)', marginBottom: 4 }}>Notices</p>
                      {warnings.map((w, i) => <p key={i} style={{ fontSize: 12, color: 'var(--amber)' }}>{w}</p>)}
                    </div>
                  )}

                  <button
                    onClick={() => router.push('/arbor/dashboard' as any)}
                    className="btn btn--primary btn--block btn--lg"
                    style={{ marginBottom: 8 }}
                  >
                    View dashboard →
                  </button>
                  <button onClick={handleReset} className="btn btn--ghost btn--block">
                    Upload more files
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function StatBox({
  value, label, highlight,
}: {
  value:      string | number
  label:      string
  highlight?: 'red' | 'amber' | 'green'
}) {
  const valueColor =
    highlight === 'red'   ? 'var(--red)' :
    highlight === 'amber' ? 'var(--amber)' :
    highlight === 'green' ? 'var(--chalk-green)' :
    'var(--ink)'

  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 10, background: 'var(--paper-2)', padding: 16, textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--f-display)', fontSize: 26, fontStyle: 'italic', color: valueColor }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>{label}</div>
    </div>
  )
}
```

- [ ] **Step 2: Run build**

```bash
cd "/Users/kotirobert/websites/arbor ai/.claude/worktrees/pensive-albattani-bf3efc" && npm run build 2>&1 | tail -20
```

Expected: clean build.

- [ ] **Step 3: Commit**

```bash
cd "/Users/kotirobert/websites/arbor ai/.claude/worktrees/pensive-albattani-bf3efc"
git add "app/(platform)/arbor/upload/page.tsx"
git commit -m "feat: migrate upload page to CSS tokens + ArborSidebar"
```

---

## Task 6: Migrate pupil detail page

**Files:**
- Modify: `app/(platform)/arbor/pupil/[id]/page.tsx`

- [ ] **Step 1: Replace the file content**

```tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPupilFullRecord, getMockDataSource } from '@/lib/data/queries'
import { PupilDetailClient } from '@/components/pupil/PupilDetailClient'
import { ArborSidebar } from '@/components/arbor/ArborSidebar'
import type { Pupil, AttendanceSummary, BehaviourSummary, RiskProfile } from '@/types'

interface PupilPageProps {
  params: Promise<{ id: string }>
}

export default async function ArborPupilPage({ params }: PupilPageProps) {
  const { id } = await params

  const record = await getPupilFullRecord(id, getMockDataSource())

  if (!record?.pupil || !record.attendance || !record.behaviour || !record.risk) {
    notFound()
  }

  const pupilName = `${record.pupil.firstName} ${record.pupil.lastName}`

  return (
    <div className="app">
      <ArborSidebar role="slt" schoolName="Greenfield Primary School" lastUpload="—" />
      <main className="app__main" style={{ overflowY: 'auto', background: 'var(--paper-2)' }}>
        {/* Breadcrumb topbar */}
        <div style={{
          height: 52, borderBottom: '1px solid var(--line)', background: 'var(--paper)',
          display: 'flex', alignItems: 'center', padding: '0 28px', flexShrink: 0,
        }}>
          <div style={{ fontSize: 13, color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link href="/arbor/dashboard" style={{ color: 'var(--ink-3)' }}>Arbor AI</Link>
            <span style={{ color: 'var(--ink-3)' }}>/</span>
            <Link href="/arbor/dashboard" style={{ color: 'var(--ink-3)' }}>Dashboard</Link>
            <span style={{ color: 'var(--ink-3)' }}>/</span>
            <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{pupilName}</span>
          </div>
        </div>

        <PupilDetailClient
          pupil={record.pupil as Pupil}
          attendance={record.attendance as AttendanceSummary}
          behaviour={record.behaviour as BehaviourSummary}
          risk={record.risk as RiskProfile}
        />
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd "/Users/kotirobert/websites/arbor ai/.claude/worktrees/pensive-albattani-bf3efc"
git add "app/(platform)/arbor/pupil/[id]/page.tsx"
git commit -m "feat: migrate pupil detail page to CSS tokens + ArborSidebar"
```

---

## Task 7: Delete `ArborToolbar`

**Files:**
- Delete: `components/arbor/ArborToolbar.tsx`

- [ ] **Step 1: Confirm no remaining imports**

```bash
cd "/Users/kotirobert/websites/arbor ai/.claude/worktrees/pensive-albattani-bf3efc" && grep -r "ArborToolbar" --include="*.tsx" --include="*.ts" .
```

Expected: no output. If any imports appear, remove them first.

- [ ] **Step 2: Delete the file**

```bash
cd "/Users/kotirobert/websites/arbor ai/.claude/worktrees/pensive-albattani-bf3efc"
git rm components/arbor/ArborToolbar.tsx
git commit -m "chore: delete ArborToolbar (replaced by ArborSidebar)"
```

---

## Task 8: Final build verification

- [ ] **Step 1: Run full build**

```bash
cd "/Users/kotirobert/websites/arbor ai/.claude/worktrees/pensive-albattani-bf3efc" && npm run build 2>&1
```

Expected output (all routes clean):
```
Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /api/insights
├ ƒ /api/pupils
├ ƒ /api/pupils/[id]/summary
├ ƒ /api/upload
├ ƒ /arbor/dashboard
├ ƒ /arbor/pupil/[id]
├ ○ /arbor/upload
├ ○ /chalkai
├ ○ /sign-in
└ ○ /sign-up
```

No TypeScript errors, no missing imports.

- [ ] **Step 2: Confirm zero remaining Tailwind in migrated files**

```bash
cd "/Users/kotirobert/websites/arbor ai/.claude/worktrees/pensive-albattani-bf3efc" && grep -n "bg-stone\|bg-brand\|bg-white\|bg-amber\|bg-blue\|bg-red\|text-stone\|border-stone\|rounded-xl\|rounded-2xl\|shadow-card\|px-6\|py-6" \
  "app/(platform)/arbor/upload/page.tsx" \
  "app/(platform)/arbor/pupil/[id]/page.tsx" \
  "app/(platform)/arbor/dashboard/page.tsx" \
  "components/dashboard/DashboardClient.tsx"
```

Expected: no output.

- [ ] **Step 3: Final commit**

```bash
cd "/Users/kotirobert/websites/arbor ai/.claude/worktrees/pensive-albattani-bf3efc"
git log --oneline -8
```

Expected: 7 commits visible from this work.
