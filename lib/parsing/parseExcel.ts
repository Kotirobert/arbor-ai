import * as XLSX from 'xlsx'
import type { ParsedRows } from '@/lib/parsing/parseCsv'

export function parseExcelBuffer(buffer: ArrayBuffer | Buffer): ParsedRows {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const firstSheet = workbook.SheetNames[0]
  const sheet = workbook.Sheets[firstSheet]
  const matrix = XLSX.utils.sheet_to_json<Array<string | number | boolean | null>>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  })

  const headerIndex = findHeaderIndex(matrix)
  if (headerIndex === -1) {
    return { headers: [], rows: [] }
  }

  const headers = matrix[headerIndex].map((value) => String(value ?? '').trim())
  const rows = matrix
    .slice(headerIndex + 1)
    .map((line) => Object.fromEntries(
      headers.map((header, index) => [header, String(line[index] ?? '').trim()]),
    ))
    .filter((row) => Object.values(row).some((value) => value.trim()))

  return { headers: headers.filter(Boolean), rows }
}

function findHeaderIndex(matrix: Array<Array<string | number | boolean | null>>): number {
  return matrix.findIndex((line, index) => {
    if (index > 15) return false
    const normalised = line.map((value) => String(value ?? '').trim().toLowerCase())
    return normalised.includes('pupil name') ||
      normalised.includes('student name') ||
      normalised.includes('student id') ||
      normalised.includes('first name') ||
      normalised.includes('upn') ||
      normalised.includes('subject')
  })
}
