import { describe, expect, test } from 'vitest'
import { combineAttainmentUploads, renameUploadSubject, renameUploadTerm } from '@/lib/analytics/uploads'
import type { AttainmentUpload } from '@/lib/attainmentStore'

const upload = (id: string, fileName: string, pupils: string[]): AttainmentUpload => ({
  id,
  schoolId: 'school-1',
  fileName,
  originalColumns: ['Pupil Name', 'Subject', 'Term', 'Attainment'],
  detectedColumns: {
    pupilName: 'Pupil Name',
    subject: 'Subject',
    term: 'Term',
    attainment: 'Attainment',
  },
  detectedSummary: {
    rows: pupils.length,
    pupils: pupils.length,
    subjects: ['Reading'],
    terms: ['Spring 2026'],
    yearGroups: ['Year 2'],
    classes: ['2A'],
    groups: [],
  },
  records: pupils.map((pupilName, index) => ({
    id: `${id}-${index}`,
    uploadId: id,
    schoolId: 'school-1',
    pupilName,
    pupilId: pupilName.toLowerCase().replace(/\s+/g, '-'),
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
    sourceFileName: fileName,
    createdAt: '2026-04-29T10:00:00.000Z',
  })),
  warnings: [],
  createdAt: '2026-04-29T10:00:00.000Z',
})

describe('combineAttainmentUploads', () => {
  test('creates one dashboard upload from multiple parsed files', () => {
    const combined = combineAttainmentUploads([
      upload('upload-1', 'reading.csv', ['Anna Smith']),
      upload('upload-2', 'maths.csv', ['Ben Jones']),
    ])

    expect(combined.fileName).toBe('2 files combined')
    expect(combined.detectedSummary.pupils).toBe(2)
    expect(combined.detectedSummary.rows).toBe(2)
    expect(combined.records.map((record) => record.uploadId)).toEqual([combined.id, combined.id])
  })

  test('renames a source upload subject before combining', () => {
    const renamed = renameUploadSubject(upload('upload-1', 'maths.csv', ['Anna Smith']), 'Mathematics')

    expect(renamed.detectedSummary.subjects).toEqual(['Mathematics'])
    expect(renamed.records[0]).toMatchObject({
      subject: 'Mathematics',
      sourceFileName: 'maths.csv',
    })
  })

  test('renames a term across a source upload before combining', () => {
    const renamed = renameUploadTerm(upload('upload-1', 'reading.csv', ['Anna Smith']), 'Spring 2026', 'Summer 2026')

    expect(renamed.detectedSummary.terms).toEqual(['Summer 2026'])
    expect(renamed.records[0].term).toBe('Summer 2026')
  })
})
