import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import {
  clearAttainmentUploadsForSchool,
  deleteAttainmentUpload,
  getAttainmentUpload,
  listAttainmentUploads,
  saveAttainmentUpload,
} from '@/lib/server/attainmentRepository'
import type { AttainmentUpload } from '@/lib/attainmentTypes'

const makeUpload = (id: string, schoolId = 'school-1'): AttainmentUpload => ({
  id,
  schoolId,
  fileName: `${id}.csv`,
  originalColumns: ['Pupil Name', 'Subject', 'Term', 'Attainment'],
  detectedColumns: {
    pupilName: 'Pupil Name',
    subject: 'Subject',
    term: 'Term',
    attainment: 'Attainment',
  },
  detectedSummary: {
    rows: 1,
    pupils: 1,
    subjects: ['Reading'],
    terms: ['Spring 2026'],
    yearGroups: ['Year 2'],
    classes: ['2A'],
    groups: [],
  },
  records: [{
    id: `${id}-record`,
    uploadId: id,
    schoolId,
    pupilId: 'anna-smith',
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
    sourceFileName: `${id}.csv`,
    createdAt: '2026-04-29T10:00:00.000Z',
  }],
  warnings: [],
  createdAt: '2026-04-29T10:00:00.000Z',
})

let dataDir = ''

beforeEach(() => {
  dataDir = mkdtempSync(join(tmpdir(), 'arbor-attainment-'))
  process.env.ARBOR_ATTAINMENT_DATA_DIR = dataDir
})

afterEach(() => {
  rmSync(dataDir, { recursive: true, force: true })
  delete process.env.ARBOR_ATTAINMENT_DATA_DIR
})

describe('attainmentRepository', () => {
  test('saves and lists uploads by school with newest first', async () => {
    await saveAttainmentUpload(makeUpload('upload-1'))
    await saveAttainmentUpload({ ...makeUpload('upload-2'), createdAt: '2026-04-30T10:00:00.000Z' })
    await saveAttainmentUpload(makeUpload('other-school', 'school-2'))

    const uploads = await listAttainmentUploads('school-1')

    expect(uploads.map((upload) => upload.id)).toEqual(['upload-2', 'upload-1'])
  })

  test('gets and deletes a single upload for a school', async () => {
    await saveAttainmentUpload(makeUpload('upload-1'))

    await expect(getAttainmentUpload('school-1', 'upload-1')).resolves.toMatchObject({ id: 'upload-1' })
    await expect(deleteAttainmentUpload('school-1', 'upload-1')).resolves.toBe(true)
    await expect(getAttainmentUpload('school-1', 'upload-1')).resolves.toBeNull()
  })

  test('clears only the requested school uploads', async () => {
    await saveAttainmentUpload(makeUpload('upload-1'))
    await saveAttainmentUpload(makeUpload('other-school', 'school-2'))

    await clearAttainmentUploadsForSchool('school-1')

    await expect(listAttainmentUploads('school-1')).resolves.toEqual([])
    await expect(listAttainmentUploads('school-2')).resolves.toHaveLength(1)
  })
})
