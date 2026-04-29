import { NextResponse } from 'next/server'
import {
  deleteAttainmentUpload,
  getAttainmentUpload,
} from '@/lib/server/attainmentRepository'

const SCHOOL_ID = 'school-1'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const upload = await getAttainmentUpload(SCHOOL_ID, id)
  if (!upload) return NextResponse.json({ error: 'Upload not found.' }, { status: 404 })
  return NextResponse.json({ upload })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const deleted = await deleteAttainmentUpload(SCHOOL_ID, id)
  return NextResponse.json({ success: deleted })
}
