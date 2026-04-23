import { NextResponse } from 'next/server'
import { parseSchoolCSV } from '@/lib/csvParser'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const name = file.name.toLowerCase()
    if (!name.endsWith('.csv') && !name.endsWith('.txt')) {
      return NextResponse.json(
        { error: 'Please upload a CSV file. To use an Excel file, save it as CSV first (File → Save As → CSV).' },
        { status: 400 },
      )
    }

    const text = await file.text()

    if (text.trim().length === 0) {
      return NextResponse.json({ error: 'The file appears to be empty.' }, { status: 422 })
    }

    // Parse the CSV into structured school data
    const result = parseSchoolCSV(text)

    if (result.pupils.length === 0) {
      return NextResponse.json(
        {
          error: result.warnings[0] ?? 'No valid pupil records found.',
          warnings: result.warnings,
        },
        { status: 422 },
      )
    }

    console.log(
      `[upload] Parsed ${result.pupils.length} pupils from ${file.name} ` +
      `(format: ${result.sourceFormat})`,
    )

    // Return the full parsed data to the client to store in sessionStorage.
    // In production with a DB: persist via Prisma here and return only the stats.
    return NextResponse.json({
      success:    true,
      data:       result,
      stats: {
        pupils:          result.pupils.length,
        yearGroups:      [...new Set(result.pupils.map((p) => p.yearGroup))].length,
        persistentAbsence: result.attendance.filter((a) => a.overallPct < 90).length,
        avgAttendance:   result.stats.overallAttendancePct,
        subjects:        Object.keys(result.subjectProfiles[0]?.subjects ?? {}).length,
      },
      warnings:   result.warnings,
      importedAt: result.importedAt,
    })
  } catch (err) {
    console.error('[upload] Error:', err)
    return NextResponse.json(
      { error: 'Failed to process file. Please check the format and try again.' },
      { status: 500 },
    )
  }
}

