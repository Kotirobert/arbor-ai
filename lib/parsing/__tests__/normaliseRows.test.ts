import { describe, expect, test } from 'vitest'
import { detectColumns } from '@/lib/parsing/detectColumns'
import { normaliseRows } from '@/lib/parsing/normaliseRows'

describe('attainment upload parsing', () => {
  test('detects and normalises long format attainment files', () => {
    const rows = [
      {
        'Student Name': 'Anna Smith',
        Year: 'Year 2',
        Class: '2A',
        Gender: 'Female',
        Subject: 'Reading',
        'Assessment Period': 'Spring 2026',
        Grade: 'Expected Standard',
      },
      {
        'Student Name': 'Ben Jones',
        Year: 'Year 2',
        Class: '2A',
        Gender: 'Male',
        Subject: 'Reading',
        'Assessment Period': 'Spring 2026',
        Grade: 'Working Towards',
      },
    ]

    const columns = detectColumns(Object.keys(rows[0]))
    const result = normaliseRows(rows, {
      uploadId: 'upload-1',
      schoolId: 'school-1',
      sourceFileName: 'long.csv',
      detectedColumns: columns,
      createdAt: '2026-04-29T09:00:00.000Z',
    })

    expect(columns).toMatchObject({
      pupilName: 'Student Name',
      yearGroup: 'Year',
      className: 'Class',
      sex: 'Gender',
      subject: 'Subject',
      term: 'Assessment Period',
      attainment: 'Grade',
    })
    expect(result.records).toHaveLength(2)
    expect(result.records[0]).toMatchObject({
      pupilName: 'Anna Smith',
      subject: 'Reading',
      term: 'Spring 2026',
      attainmentBand: 'EXS',
    })
  })

  test('detects wide markbook columns and converts them into long records', () => {
    const rows = [
      {
        'Pupil Name': 'Anna Smith',
        'Year Group': 'Year 2',
        Class: '2A',
        Sex: 'Female',
        'Reading Spring 2026': 'EXS',
        'Writing Spring 2026': 'WTS',
        'Maths Spring 2026': 'Greater Depth',
      },
    ]

    const columns = detectColumns(Object.keys(rows[0]))
    const result = normaliseRows(rows, {
      uploadId: 'upload-1',
      schoolId: 'school-1',
      sourceFileName: 'wide.csv',
      detectedColumns: columns,
      createdAt: '2026-04-29T09:00:00.000Z',
    })

    expect(columns.wideAttainmentColumns).toEqual([
      'Reading Spring 2026',
      'Writing Spring 2026',
      'Maths Spring 2026',
    ])
    expect(result.records.map((record) => `${record.subject}:${record.term}:${record.attainmentBand}`)).toEqual([
      'Reading:Spring 2026:EXS',
      'Writing:Spring 2026:WTS',
      'Maths:Spring 2026:GDS',
    ])
    expect(result.summary.subjects).toEqual(['Maths', 'Reading', 'Writing'])
    expect(result.summary.pupils).toBe(1)
  })

  test('uses the markbook filename as the subject when term columns hold attainment bands', () => {
    const rows = [
      {
        'Pupil Name': 'Anna Smith',
        Year: 'Year 2',
        Class: '2A',
        Gender: 'Female',
        Autumn: 'WTS',
        Spring: 'Expected Standard',
        Summer: '',
      },
      {
        'Pupil Name': 'Ben Jones',
        Year: 'Year 2',
        Class: '2A',
        Gender: 'Male',
        Autumn: 'EXS',
        Spring: 'Greater Depth',
        Summer: '',
      },
    ]

    const columns = detectColumns(Object.keys(rows[0]))
    const result = normaliseRows(rows, {
      uploadId: 'upload-1',
      schoolId: 'school-1',
      sourceFileName: '2026-04-28 Markbook - English Reading 2025-2026.csv',
      detectedColumns: columns,
      createdAt: '2026-04-29T09:00:00.000Z',
    })

    expect(result.records).toHaveLength(4)
    expect(result.records.map((record) => `${record.subject}:${record.term}:${record.attainmentBand}`)).toEqual([
      'English Reading:Autumn 2025:WTS',
      'English Reading:Spring 2026:EXS',
      'English Reading:Autumn 2025:EXS',
      'English Reading:Spring 2026:GDS',
    ])
  })
})
