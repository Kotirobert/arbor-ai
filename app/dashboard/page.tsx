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
import { Navbar } from '@/components/ui/Navbar'
import { SkeletonDashboard } from '@/components/ui/Skeleton'
import { DashboardClientWrapper } from '@/components/dashboard/DashboardClientWrapper'
import type { UserRole } from '@/types'

interface DashboardPageProps {
  searchParams: Promise<{ role?: string; year?: string }>
}

const VALID_ROLES: UserRole[] = ['slt', 'hoy', 'teacher']
const YEAR_GROUPS = ['Reception', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6']

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams
  const role: UserRole = VALID_ROLES.includes(params.role as UserRole)
    ? (params.role as UserRole)
    : 'slt'

  const yearGroup = YEAR_GROUPS.includes(params.year ?? '') ? params.year : 'Year 6'

  const scope = {
    role,
    yearGroup: role === 'hoy' ? yearGroup : undefined,
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
    <div className="min-h-screen bg-stone-50">
      <Navbar role={role} schoolName="Greenfield Primary School" lastUpload={lastImport} />
      <Suspense fallback={<SkeletonDashboard />}>
        <DashboardClientWrapper
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
