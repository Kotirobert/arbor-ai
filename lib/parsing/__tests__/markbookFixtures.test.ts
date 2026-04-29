import * as XLSX from 'xlsx'
import { describe, expect, test } from 'vitest'
import { detectColumns } from '@/lib/parsing/detectColumns'
import { normaliseRows } from '@/lib/parsing/normaliseRows'
import { parseCsvText } from '@/lib/parsing/parseCsv'
import { parseExcelBuffer } from '@/lib/parsing/parseExcel'

const markbookRows = [
  {
    'Pupil Name': 'Anna Smith',
    Year: 'Year 2',
    Class: '2A',
    Sex: 'F',
    Autumn: 'Working Towards Standard',
    Spring: 'Expected Standard',
    Summer: '',
    'Academic Year: Curriculum Expectations': 'EXS',
  },
  {
    'Pupil Name': 'Ben Jones',
    Year: 'Year 2',
    Class: '2A',
    Sex: 'M',
    Autumn: 'pre working towards',
    Spring: 'Greater Depth Standard',
    Summer: '',
    'Academic Year: Curriculum Expectations': 'EXS',
  },
]

const subjectFiles = [
  ['2026-04-28 Markbook - English Reading 2025-2026.csv', 'English Reading'],
  ['2026-04-28 Markbook - English Writing 2025-2026.csv', 'English Writing'],
  ['2026-04-28 Markbook - Mathematics 2025-2026.csv', 'Maths'],
  ['2026-04-28 Markbook - Religious Education 2025-2026.csv', 'Religious Education'],
  ['2026-04-28 Markbook - Science 2025-2026.csv', 'Science'],
] as const

describe('real school markbook fixture coverage', () => {
  test('normalises subject-in-filename markbooks across core CSV exports', () => {
    for (const [fileName, subject] of subjectFiles) {
      const columns = detectColumns(Object.keys(markbookRows[0]))
      const result = normaliseRows(markbookRows, {
        uploadId: `upload-${subject}`,
        schoolId: 'school-1',
        sourceFileName: fileName,
        detectedColumns: columns,
        createdAt: '2026-04-29T09:00:00.000Z',
      })

      expect(result.records).toHaveLength(4)
      expect(result.summary).toMatchObject({
        pupils: 2,
        subjects: [subject],
        terms: ['Autumn 2025', 'Spring 2026'],
        groups: ['Sex'],
      })
      expect(result.records.map((record) => record.attainmentBand)).toEqual(['WTS', 'EXS', 'PRE', 'GDS'])
      expect(result.records.every((record) => record.subject === subject)).toBe(true)
      expect(result.records.some((record) => record.term === 'Summer 2026')).toBe(false)
      expect(result.records.some((record) => record.term === 'Academic Year: Curriculum Expectations')).toBe(false)
    }
  })

  test('skips metadata rows in CSV and Excel markbook exports', () => {
    const csv = [
      'Arbor assessment markbook,,,,,,',
      'Exported,2026-04-28,,,,,',
      'Pupil Name,Year,Class,Sex,Autumn,Spring,Summer',
      'Anna Smith,Year 2,2A,F,WTS,Expected,',
      'Ben Jones,Year 2,2A,M,PRE,Greater Depth,',
    ].join('\n')

    const csvParsed = parseCsvText(csv)
    const excelParsed = parseExcelBuffer(makeWorkbookBuffer([
      ['Arbor assessment markbook'],
      ['Exported', '2026-04-28'],
      ['Pupil Name', 'Year', 'Class', 'Sex', 'Autumn', 'Spring', 'Summer'],
      ['Anna Smith', 'Year 2', '2A', 'F', 'WTS', 'Expected', ''],
      ['Ben Jones', 'Year 2', '2A', 'M', 'PRE', 'Greater Depth', ''],
    ]))

    for (const parsed of [csvParsed, excelParsed]) {
      const columns = detectColumns(parsed.headers)
      const result = normaliseRows(parsed.rows, {
        uploadId: 'upload-fixture',
        schoolId: 'school-1',
        sourceFileName: '2026-04-28 Markbook - Science 2025-2026.csv',
        detectedColumns: columns,
        createdAt: '2026-04-29T09:00:00.000Z',
      })

      expect(parsed.headers).toEqual(['Pupil Name', 'Year', 'Class', 'Sex', 'Autumn', 'Spring', 'Summer'])
      expect(parsed.rows).toHaveLength(2)
      expect(result.records.map((record) => `${record.subject}:${record.term}:${record.attainmentBand}`)).toEqual([
        'Science:Autumn 2025:WTS',
        'Science:Spring 2026:EXS',
        'Science:Autumn 2025:PRE',
        'Science:Spring 2026:GDS',
      ])
    }
  })
})

function makeWorkbookBuffer(rows: Array<Array<string>>) {
  const workbook = XLSX.utils.book_new()
  const sheet = XLSX.utils.aoa_to_sheet(rows)
  XLSX.utils.book_append_sheet(workbook, sheet, 'Markbook')
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }) as Buffer
}
