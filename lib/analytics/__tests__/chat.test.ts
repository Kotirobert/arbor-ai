import { describe, expect, test } from 'vitest'
import { answerAttainmentQuestion } from '@/lib/analytics/chat'
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

describe('answerAttainmentQuestion', () => {
  test('answers pupil count questions using unique pupils', () => {
    const answer = answerAttainmentQuestion('How many pupils are there?', [
      record({ id: '1', pupilId: 'p1', pupilName: 'Anna Smith', term: 'Autumn 2025' }),
      record({ id: '2', pupilId: 'p1', pupilName: 'Anna Smith', term: 'Spring 2026' }),
      record({ id: '3', pupilId: 'p2', pupilName: 'Ben Jones', term: 'Spring 2026' }),
    ])

    expect(answer).toContain('2 pupils')
    expect(answer).toContain('3 attainment records')
    expect(answer).toContain('Current filters')
  })

  test('answers strongest subject questions', () => {
    const answer = answerAttainmentQuestion('Which subject is strongest?', [
      record({ id: '1', subject: 'Reading', attainmentBand: 'EXS' }),
      record({ id: '2', subject: 'Reading', attainmentBand: 'GDS' }),
      record({ id: '3', subject: 'Maths', attainmentBand: 'WTS' }),
    ])

    expect(answer).toContain('Reading')
    expect(answer).toContain('100%')
    expect(answer).toContain('Calculation')
  })
})
