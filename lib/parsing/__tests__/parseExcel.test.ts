import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { parseExcelBuffer } from '@/lib/parsing/parseExcel'

describe('Excel parsing', () => {
  test('finds the real header row after exported title rows', () => {
    const buffer = readFileSync(join(process.cwd(), 'mock_one_form_entry_school.xlsx'))
    const parsed = parseExcelBuffer(buffer)

    expect(parsed.headers).toContain('First Name')
    expect(parsed.headers).toContain('Reading')
    expect(parsed.rows).toHaveLength(210)
    expect(parsed.rows[0]['First Name']).toBe('Ethan')
  })
})
