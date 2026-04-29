import { describe, expect, test } from 'vitest'
import { buildReportSummary } from '@/lib/analytics/report'
import type { AttainmentRecord } from '@/lib/analytics/attainment'

const record = (overrides: Partial<AttainmentRecord>): AttainmentRecord => ({
  id: 'record-1',
  uploadId: 'upload-1',
  schoolId: 'school-1',
  pupilId: 'p1',
  pupilName: 'Anna Smith',
  yearGroup: 'Year 2',
  className: '2A',
  subject: 'Reading',
  term: 'Spring 2026',
  fsm: null,
  ever6: null,
  send: null,
  eal: null,
  pupilPremium: null,
  rawAttainment: 'EXS',
  attainmentBand: 'EXS',
  sourceFileName: 'test.csv',
  createdAt: '2026-04-29T09:00:00.000Z',
  ...overrides,
})

describe('buildReportSummary', () => {
  test('uses unique pupils and identifies strongest and weakest subjects', () => {
    const summary = buildReportSummary([
      record({ id: '1', pupilId: 'p1', pupilName: 'Anna Smith', subject: 'Reading', attainmentBand: 'EXS' }),
      record({ id: '2', pupilId: 'p1', pupilName: 'Anna Smith', subject: 'Reading', attainmentBand: 'GDS' }),
      record({ id: '3', pupilId: 'p2', pupilName: 'Ben Jones', subject: 'Maths', attainmentBand: 'WTS' }),
    ])

    expect(summary.pupilCount).toBe(2)
    expect(summary.recordCount).toBe(3)
    expect(summary.strongestSubject?.name).toBe('Reading')
    expect(summary.weakestSubject?.name).toBe('Maths')
  })
})
