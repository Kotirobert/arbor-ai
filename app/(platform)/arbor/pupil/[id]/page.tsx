import { Suspense } from 'react'
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
      <Suspense fallback={null}><ArborSidebar role="slt" schoolName="Greenfield Primary School" lastUpload="—" /></Suspense>
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
