import { NextResponse } from 'next/server'
import {
  clearAttainmentUploadsForSchool,
  listAttainmentUploads,
} from '@/lib/server/attainmentRepository'

const SCHOOL_ID = 'school-1'

export async function GET() {
  const uploads = await listAttainmentUploads(SCHOOL_ID)
  return NextResponse.json({ uploads })
}

export async function DELETE() {
  await clearAttainmentUploadsForSchool(SCHOOL_ID)
  return NextResponse.json({ success: true })
}
