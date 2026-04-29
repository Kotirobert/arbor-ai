import Papa from 'papaparse'

export type ParsedRows = {
  rows: Record<string, string>[]
  headers: string[]
}

export function parseCsvText(text: string): ParsedRows {
  const clean = text.replace(/^\uFEFF/, '')
  const csv = stripLeadingMetadataRows(clean)
  const result = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
    transform: (value) => String(value ?? '').trim(),
  })

  if (result.errors.some((error) => error.type === 'Delimiter')) {
    throw new Error('The file could not be read as a CSV.')
  }

  const headers = result.meta.fields?.filter(Boolean) ?? []
  return {
    headers,
    rows: (result.data ?? []).filter((row) => Object.values(row).some((value) => String(value ?? '').trim())),
  }
}

function stripLeadingMetadataRows(text: string): string {
  const lines = text.split(/\r?\n/)
  const headerIndex = lines.findIndex((line, index) => {
    if (index > 10) return false
    const lower = line.toLowerCase()
    return lower.includes('pupil name') ||
      lower.includes('student name') ||
      lower.includes('student id') ||
      lower.includes('first name') ||
      lower.includes('upn') ||
      lower.includes('subject')
  })

  return headerIndex > 0 ? lines.slice(headerIndex).join('\n') : text
}
