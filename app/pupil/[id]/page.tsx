import { notFound } from 'next/navigation'
import { getPupilFullRecord, getMockDataSource } from '@/lib/data/queries'
import { Navbar } from '@/components/ui/Navbar'
import { PupilDetailClient } from '@/components/pupil/PupilDetailClient'
import type { Pupil, AttendanceSummary, BehaviourSummary, RiskProfile } from '@/types'

interface PupilPageProps {
  params: Promise<{ id: string }>
}

export default async function PupilPage({ params }: PupilPageProps) {
  const { id } = await params

  // Server-side: always use mock data as baseline.
  // PupilDetailClient will override with uploaded data on the client via the API call.
  const record = await getPupilFullRecord(id, getMockDataSource())

  if (!record?.pupil || !record.attendance || !record.behaviour || !record.risk) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar role="slt" schoolName="Greenfield Primary School" />
      <PupilDetailClient
        pupil={record.pupil as Pupil}
        attendance={record.attendance as AttendanceSummary}
        behaviour={record.behaviour as BehaviourSummary}
        risk={record.risk as RiskProfile}
      />
    </div>
  )
}
