import { describe, expect, test } from 'vitest'
import {
  calculatePupilMovement,
  countUniquePupils,
  getDashboardSections,
  getInterventionCandidates,
  groupByDemographic,
  groupBySubject,
  normaliseAttainmentBand,
  summariseAttainment,
  type AttainmentRecord,
} from '@/lib/analytics/attainment'

const baseRecord = (overrides: Partial<AttainmentRecord>): AttainmentRecord => ({
  id: 'record-1',
  uploadId: 'upload-1',
  schoolId: 'school-1',
  pupilName: 'Anna Smith',
  yearGroup: 'Year 2',
  className: '2A',
  subject: 'Reading',
  term: 'Spring 2026',
  sex: 'Female',
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

describe('attainment analytics', () => {
  test('normalises messy school labels into standard bands', () => {
    expect(normaliseAttainmentBand('pre working towards')).toBe('PRE')
    expect(normaliseAttainmentBand('Working Towards Standard')).toBe('WTS')
    expect(normaliseAttainmentBand('at expected')).toBe('EXS')
    expect(normaliseAttainmentBand('Greater Depth Standard')).toBe('GDS')
    expect(normaliseAttainmentBand('secure-ish')).toBe('UNKNOWN')
  })

  test('summarises PRE, WTS, EXS, GDS and keeps GDS inside expected or above', () => {
    const records = [
      baseRecord({ id: '1', attainmentBand: 'PRE' }),
      baseRecord({ id: '2', attainmentBand: 'WTS' }),
      baseRecord({ id: '3', attainmentBand: 'EXS' }),
      baseRecord({ id: '4', attainmentBand: 'GDS' }),
    ]

    const summary = summariseAttainment(records)

    expect(summary.total).toBe(4)
    expect(summary.prePct + summary.wtsPct + summary.exsPct + summary.gdsPct).toBe(100)
    expect(summary.exsPlus).toBe(2)
    expect(summary.exsPlusPct).toBe(50)
    expect(summary.belowExpected).toBe(2)
  })

  test('groups summaries by subject and demographic values', () => {
    const records = [
      baseRecord({ id: '1', subject: 'Reading', sex: 'Female', attainmentBand: 'GDS' }),
      baseRecord({ id: '2', subject: 'Reading', sex: 'Male', attainmentBand: 'WTS' }),
      baseRecord({ id: '3', subject: 'Maths', sex: 'Male', attainmentBand: 'EXS' }),
    ]

    expect(groupBySubject(records).Reading.exsPlusPct).toBe(50)
    expect(groupBySubject(records).Maths.exsPlusPct).toBe(100)
    expect(groupByDemographic(records, 'sex').Male.total).toBe(2)
  })

  test('counts unique pupils separately from attainment records', () => {
    const records = [
      baseRecord({ id: '1', pupilId: 'p1', pupilName: 'Anna Smith', subject: 'Reading', term: 'Autumn 2025' }),
      baseRecord({ id: '2', pupilId: 'p1', pupilName: 'Anna Smith', subject: 'Reading', term: 'Spring 2026' }),
      baseRecord({ id: '3', pupilId: 'p2', pupilName: 'Ben Jones', subject: 'Reading', term: 'Autumn 2025' }),
    ]

    expect(records).toHaveLength(3)
    expect(countUniquePupils(records)).toBe(2)
  })

  test('only enables dashboard sections when the uploaded data supports them', () => {
    const singleClass = [
      baseRecord({ id: '1', subject: 'Reading', term: 'Spring 2026', sex: undefined, className: '2A' }),
      baseRecord({ id: '2', subject: 'Writing', term: 'Spring 2026', sex: undefined, className: '2A' }),
    ]
    expect(getDashboardSections(singleClass)).not.toContain('boysGirlsComparison')
    expect(getDashboardSections(singleClass)).not.toContain('yearGroupHeatmap')
    expect(getDashboardSections(singleClass)).not.toContain('trendChart')

    const wholeSchool = [
      baseRecord({ id: '1', pupilName: 'Anna Smith', subject: 'Reading', term: 'Autumn 2025', yearGroup: 'Year 1', className: '1A', sex: 'Female' }),
      baseRecord({ id: '2', pupilName: 'Ben Jones', subject: 'Reading', term: 'Spring 2026', yearGroup: 'Year 2', className: '2A', sex: 'Male', fsm: true }),
    ]
    expect(getDashboardSections(wholeSchool)).toEqual(expect.arrayContaining([
      'boysGirlsComparison',
      'groupComparison',
      'yearGroupHeatmap',
      'classComparison',
      'trendChart',
      'pupilMovement',
    ]))
  })

  test('calculates pupil movement between two terms for matching pupils and subjects', () => {
    const movement = calculatePupilMovement([
      baseRecord({ id: '1', pupilId: 'p1', pupilName: 'Anna Smith', subject: 'Reading', term: 'Autumn 2025', attainmentBand: 'WTS' }),
      baseRecord({ id: '2', pupilId: 'p1', pupilName: 'Anna Smith', subject: 'Reading', term: 'Spring 2026', attainmentBand: 'EXS' }),
      baseRecord({ id: '3', pupilId: 'p2', pupilName: 'Ben Jones', subject: 'Maths', term: 'Autumn 2025', attainmentBand: 'GDS' }),
      baseRecord({ id: '4', pupilId: 'p2', pupilName: 'Ben Jones', subject: 'Maths', term: 'Spring 2026', attainmentBand: 'EXS' }),
    ], 'Autumn 2025', 'Spring 2026')

    expect(movement.map((m) => m.movement)).toEqual(['up', 'down'])
  })

  test('prioritises pupils below expected across core subjects', () => {
    const candidates = getInterventionCandidates([
      baseRecord({ id: '1', pupilId: 'p1', pupilName: 'Anna Smith', subject: 'Reading', attainmentBand: 'WTS' }),
      baseRecord({ id: '2', pupilId: 'p1', pupilName: 'Anna Smith', subject: 'Maths', attainmentBand: 'PRE' }),
      baseRecord({ id: '3', pupilId: 'p2', pupilName: 'Ben Jones', subject: 'Writing', attainmentBand: 'WTS' }),
    ])

    expect(candidates[0]).toMatchObject({
      pupilName: 'Anna Smith',
      priority: 'High',
      subjectsBelowExpected: ['Maths', 'Reading'],
    })
    expect(candidates[1].priority).toBe('Medium')
  })
})
