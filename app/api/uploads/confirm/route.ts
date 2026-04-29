import { NextResponse } from 'next/server'
import { saveAttainmentUpload } from '@/lib/server/attainmentRepository'
import type { AttainmentUpload } from '@/lib/attainmentTypes'

const SCHOOL_ID = 'school-1'

export async function POST(req: Request) {
  try {
    const upload = await req.json() as AttainmentUpload
    if (!upload?.id || !upload.fileName || !Array.isArray(upload.records)) {
      return NextResponse.json({ error: 'Upload payload is invalid.' }, { status: 400 })
    }

    const saved = await saveAttainmentUpload({
      ...upload,
      schoolId: SCHOOL_ID,
      records: upload.records.map((record) => ({ ...record, schoolId: SCHOOL_ID, uploadId: upload.id })),
    })

    return NextResponse.json({ success: true, upload: saved })
  } catch (error) {
    console.error('[uploads/confirm]', error)
    return NextResponse.json({ error: 'Upload could not be saved.' }, { status: 500 })
  }
}
