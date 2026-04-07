import { NextResponse } from 'next/server'
import { getPupilFullRecord, getMockDataSource } from '@/lib/data/queries'
import { generatePupilSummary } from '@/lib/ai'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    // Accept optional uploaded data snapshot from the client
    const body = await req.json().catch(() => ({})) as {
      schoolData?: {
        pupils: unknown[]
        attendance: unknown[]
        behaviour: unknown[]
        subjectProfiles: unknown[]
        riskProfiles: unknown[]
        stats: unknown
      }
    }

    // Use uploaded data if provided, otherwise fall back to mock
    const source = body.schoolData
      ? {
          ...getMockDataSource(),
          ...(body.schoolData as ReturnType<typeof getMockDataSource>),
        }
      : getMockDataSource()

    const record = await getPupilFullRecord(id, source)

    if (!record?.pupil || !record.attendance || !record.behaviour || !record.risk) {
      return NextResponse.json({ error: 'Pupil not found' }, { status: 404 })
    }

    const summary = await generatePupilSummary(
      record.pupil,
      record.attendance,
      record.behaviour,
      record.risk,
      record.subjects,
    )

    return NextResponse.json({ summary })
  } catch (err) {
    console.error('[summary]', err)
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 })
  }
}
