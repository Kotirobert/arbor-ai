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

  test('builds subject rows with unique pupils and attainment percentages for the report table', () => {
    const summary = buildReportSummary([
      record({ id: '1', pupilId: 'p1', subject: 'Reading', attainmentBand: 'EXS' }),
      record({ id: '2', pupilId: 'p1', subject: 'Reading', attainmentBand: 'GDS' }),
      record({ id: '3', pupilId: 'p2', subject: 'Reading', attainmentBand: 'WTS' }),
      record({ id: '4', pupilId: 'p3', subject: 'Maths', attainmentBand: 'PRE' }),
    ])

    expect(summary.subjectRows).toEqual([
      expect.objectContaining({
        subject: 'Reading',
        pupilCount: 2,
        recordCount: 3,
        exsPlusPct: 66.7,
        belowExpectedPct: 33.3,
      }),
      expect.objectContaining({
        subject: 'Maths',
        pupilCount: 1,
        recordCount: 1,
        exsPlusPct: 0,
        belowExpectedPct: 100,
      }),
    ])
  })

  test('summarises movement between the latest two terms for the report', () => {
    const summary = buildReportSummary([
      record({ id: '1', pupilId: 'p1', pupilName: 'Anna Smith', subject: 'Reading', term: 'Autumn 2025', attainmentBand: 'WTS' }),
      record({ id: '2', pupilId: 'p1', pupilName: 'Anna Smith', subject: 'Reading', term: 'Spring 2026', attainmentBand: 'EXS' }),
      record({ id: '3', pupilId: 'p2', pupilName: 'Ben Jones', subject: 'Maths', term: 'Autumn 2025', attainmentBand: 'EXS' }),
      record({ id: '4', pupilId: 'p2', pupilName: 'Ben Jones', subject: 'Maths', term: 'Spring 2026', attainmentBand: 'WTS' }),
      record({ id: '5', pupilId: 'p3', pupilName: 'Cara Lee', subject: 'Writing', term: 'Autumn 2025', attainmentBand: 'GDS' }),
      record({ id: '6', pupilId: 'p3', pupilName: 'Cara Lee', subject: 'Writing', term: 'Spring 2026', attainmentBand: 'GDS' }),
    ])

    expect(summary.movementSummary).toMatchObject({
      fromTerm: 'Autumn 2025',
      toTerm: 'Spring 2026',
      movedUp: 1,
      stayedSame: 1,
      slippedBack: 1,
      total: 3,
    })
    expect(summary.movementSummary?.slippedExamples).toEqual([
      expect.objectContaining({ pupilName: 'Ben Jones', subject: 'Maths' }),
    ])
  })
})
