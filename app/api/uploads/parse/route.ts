import { NextResponse } from 'next/server'
import { detectColumns } from '@/lib/parsing/detectColumns'
import { normaliseRows } from '@/lib/parsing/normaliseRows'
import { parseCsvText } from '@/lib/parsing/parseCsv'
import { parseExcelBuffer } from '@/lib/parsing/parseExcel'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    }

    if (file.size > 12 * 1024 * 1024) {
      return NextResponse.json({ error: 'The file is too large. Please upload a file under 12 MB.' }, { status: 413 })
    }

    const parsed = await parseRowsFromFile(file)
    if (parsed.rows.length === 0 || parsed.headers.length === 0) {
      return NextResponse.json({ error: 'No rows were found in this file.' }, { status: 422 })
    }

    const id = createId()
    const createdAt = new Date().toISOString()
    const detectedColumns = detectColumns(parsed.headers)
    const normalised = normaliseRows(parsed.rows, {
      uploadId: id,
      schoolId: 'school-1',
      sourceFileName: file.name,
      detectedColumns,
      createdAt,
    })

    if (normalised.records.length === 0) {
      return NextResponse.json({
        error: 'No attainment results were detected. Check the column mapping or upload a file with subject and attainment columns.',
        detectedColumns,
        originalColumns: parsed.headers,
        previewRows: parsed.rows.slice(0, 8),
        warnings: normalised.warnings,
      }, { status: 422 })
    }

    return NextResponse.json({
      success: true,
      upload: {
        id,
        schoolId: 'school-1',
        fileName: file.name,
        originalColumns: parsed.headers,
        detectedColumns,
        detectedSummary: normalised.summary,
        records: normalised.records,
        warnings: normalised.warnings,
        createdAt,
      },
      rows: parsed.rows,
      previewRows: parsed.rows.slice(0, 8),
    })
  } catch (error) {
    console.error('[uploads/parse]', error)
    return NextResponse.json({ error: 'The file could not be processed. Please check the format and try again.' }, { status: 500 })
  }
}

async function parseRowsFromFile(file: File) {
  const name = file.name.toLowerCase()

  if (name.endsWith('.csv') || name.endsWith('.txt')) {
    return parseCsvText(await file.text())
  }

  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    return parseExcelBuffer(await file.arrayBuffer())
  }

  throw new Error('Unsupported file type')
}

function createId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `upload-${Date.now()}-${Math.random().toString(16).slice(2)}`
}
