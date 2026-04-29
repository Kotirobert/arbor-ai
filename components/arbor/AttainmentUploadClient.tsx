'use client'

import { useMemo, useRef, useState, type CSSProperties, type ChangeEvent, type DragEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ArborSidebar } from '@/components/arbor/ArborSidebar'
import { storeAttainmentUpload, type AttainmentUpload } from '@/lib/attainmentStore'
import { combineAttainmentUploads, renameUploadSubject, renameUploadTerm } from '@/lib/analytics/uploads'
import type { DetectedColumnMap } from '@/lib/parsing/detectColumns'
import { normaliseRows } from '@/lib/parsing/normaliseRows'

type UploadState = 'idle' | 'parsing' | 'confirming' | 'ready' | 'error'
type FieldKey = Exclude<keyof DetectedColumnMap, 'wideAttainmentColumns'>

type ParseResponse = {
  success: true
  upload: AttainmentUpload
  rows: Record<string, string>[]
  previewRows: Record<string, string>[]
} | {
  error: string
  detectedColumns?: DetectedColumnMap
  originalColumns?: string[]
  previewRows?: Record<string, string>[]
  warnings?: string[]
}

const fieldLabels: Record<FieldKey, string> = {
  pupilName: 'Pupil name',
  firstName: 'First name',
  lastName: 'Last name',
  upn: 'UPN',
  yearGroup: 'Year group',
  className: 'Class',
  sex: 'Sex',
  fsm: 'FSM',
  ever6: 'Ever 6',
  send: 'SEND',
  eal: 'EAL',
  pupilPremium: 'Pupil premium',
  subject: 'Subject',
  term: 'Term',
  attainment: 'Attainment',
}

const requiredFields: FieldKey[] = ['pupilName']
const optionalFields: FieldKey[] = ['firstName', 'lastName', 'upn', 'yearGroup', 'className', 'sex', 'fsm', 'ever6', 'send', 'eal', 'pupilPremium', 'subject', 'term', 'attainment']

export function AttainmentUploadClient() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [state, setState] = useState<UploadState>('idle')
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([])
  const [upload, setUpload] = useState<AttainmentUpload | null>(null)
  const [sourceUploads, setSourceUploads] = useState<AttainmentUpload[]>([])
  const [mapping, setMapping] = useState<DetectedColumnMap>({})

  const remapped = useMemo(() => {
    if (!upload || rows.length === 0) return null
    return normaliseRows(rows, {
      uploadId: upload.id,
      schoolId: upload.schoolId,
      sourceFileName: upload.fileName,
      detectedColumns: mapping,
      createdAt: upload.createdAt,
    })
  }, [mapping, rows, upload])

  function validateFile(file: File): string | null {
    const name = file.name.toLowerCase()
    if (!name.endsWith('.csv') && !name.endsWith('.txt') && !name.endsWith('.xlsx') && !name.endsWith('.xls')) {
      return 'Upload a CSV or Excel file.'
    }
    if (file.size < 10) return 'This file appears to be empty.'
    if (file.size > 12 * 1024 * 1024) return 'Files must be under 12 MB.'
    return null
  }

  async function parseFiles(files: File[]) {
    if (files.length === 0) return

    const validationErrors = files
      .map((file) => validateFile(file))
      .filter((message): message is string => Boolean(message))

    if (validationErrors.length > 0) {
      setError(validationErrors.join('\n'))
      setState('error')
      return
    }

    setState('parsing')
    setError('')
    setFileName(files.length === 1 ? files[0].name : `${files.length} files`)

    const parsedUploads: AttainmentUpload[] = []
    const skipped: string[] = []
    let firstRows: Record<string, string>[] = []
    let firstPreviewRows: Record<string, string>[] = []

    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/uploads/parse', { method: 'POST', body: formData })
      const json = await response.json() as ParseResponse
      if (!response.ok || !('success' in json)) {
        skipped.push(`${file.name}: ${'error' in json ? json.error : 'The file could not be processed.'}`)
        continue
      }

      parsedUploads.push(json.upload)
      if (firstRows.length === 0) firstRows = json.rows
      if (firstPreviewRows.length === 0) firstPreviewRows = json.previewRows
    }

    if (parsedUploads.length === 0) {
      setError(skipped.join('\n') || 'No files could be processed.')
      setState('error')
      return
    }

    const nextUpload = combineAttainmentUploads(parsedUploads)
    const warnings = [...nextUpload.warnings, ...skipped.map((message) => `Skipped ${message}`)]

    setSourceUploads(parsedUploads)
    setUpload({ ...nextUpload, warnings })
    setRows(parsedUploads.length === 1 ? firstRows : [])
    setPreviewRows(parsedUploads.length === 1 ? firstPreviewRows : [])
    setMapping(nextUpload.detectedColumns)
    setState('confirming')
  }

  async function safeParseFiles(files: File[]) {
    try {
      await parseFiles(files)
    } catch {
      setError('Network error. Please try again.')
      setState('error')
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    if (files.length > 0) safeParseFiles(files)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    const files = Array.from(event.dataTransfer.files)
    if (files.length > 0) safeParseFiles(files)
  }

  async function confirmUpload() {
    if (!upload) return

    const confirmed: AttainmentUpload = {
      ...upload,
      detectedColumns: mapping,
      detectedSummary: remapped?.summary ?? upload.detectedSummary,
      records: remapped?.records ?? upload.records,
      warnings: remapped?.warnings ?? upload.warnings,
    }

    try {
      await storeAttainmentUpload(confirmed)
      setState('ready')
      setTimeout(() => router.push('/arbor/dashboard'), 200)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upload could not be saved.')
      setState('error')
    }
  }

  function updateMapping(field: FieldKey, column: string) {
    setMapping((current) => ({ ...current, [field]: column || undefined }))
  }

  function updateSourceUpload(nextUpload: AttainmentUpload) {
    const nextSources = sourceUploads.map((source) => source.id === nextUpload.id ? nextUpload : source)
    const nextCombined = combineAttainmentUploads(nextSources)
    const skippedWarnings = upload?.warnings.filter((warning) => warning.startsWith('Skipped ')) ?? []

    setSourceUploads(nextSources)
    setUpload({ ...nextCombined, warnings: [...nextCombined.warnings, ...skippedWarnings] })
    setMapping(nextCombined.detectedColumns)
  }

  function reset() {
    setState('idle')
    setError('')
    setFileName('')
    setRows([])
    setPreviewRows([])
    setUpload(null)
    setSourceUploads([])
    setMapping({})
    if (fileRef.current) fileRef.current.value = ''
  }

  const columns = upload?.originalColumns ?? Object.keys(previewRows[0] ?? {})
  const summary = remapped?.summary ?? upload?.detectedSummary
  const detectedRecords = remapped?.records.length ?? upload?.records.length ?? 0
  const isMultipleUpload = sourceUploads.length > 1
  const canConfirm = Boolean(upload && detectedRecords > 0 && (isMultipleUpload || mapping.pupilName || (mapping.firstName && mapping.lastName)))

  return (
    <div className="app">
      <ArborSidebar role="slt" open={true} editMode={false} />
      <main className="app__main" style={{ overflowY: 'auto', background: 'var(--paper)' }}>
        <div style={{ width: '100%', maxWidth: 1180, margin: '0 auto', padding: '32px 24px 56px' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'flex-end', marginBottom: 24 }}>
            <div>
              <p className="eyebrow">Arbor AI</p>
              <h1 className="h1" style={{ marginTop: 8 }}>Upload attainment data</h1>
              <p style={{ color: 'var(--ink-2)', marginTop: 10, maxWidth: 680, lineHeight: 1.55 }}>
                Add a CSV or Excel markbook. Arbor AI will detect the available pupils, subjects, terms and groups, then build the dashboard from those fields.
              </p>
            </div>
            <button className="btn btn--ghost" onClick={() => router.push('/arbor/dashboard')}>Dashboard</button>
          </header>

          {(state === 'idle' || state === 'error' || state === 'parsing') && (
            <section
              onDragOver={(event) => { event.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  fileRef.current?.click()
                }
              }}
              role="button"
              tabIndex={0}
              style={{
                minHeight: 320,
                border: `2px dashed ${isDragging ? 'var(--chalk-green)' : 'var(--line-2)'}`,
                background: isDragging ? 'var(--chalk-green-soft)' : 'var(--paper-2)',
                borderRadius: 8,
                display: 'grid',
                placeItems: 'center',
                padding: 32,
                cursor: 'pointer',
              }}
            >
              <input ref={fileRef} type="file" accept=".csv,.txt,.xlsx,.xls" multiple onChange={handleInputChange} style={{ display: 'none' }} />
              <div style={{ maxWidth: 520, textAlign: 'center' }}>
                <div style={{ width: 52, height: 52, border: '1px solid var(--line)', borderRadius: 8, margin: '0 auto 18px', display: 'grid', placeItems: 'center', background: 'var(--paper)' }}>
                  <UploadIcon />
                </div>
                <h2 className="h3">Drop CSV or Excel files here</h2>
                <p style={{ color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.6, marginTop: 10 }}>
                  Upload one file or many. Long files with Subject and Attainment columns work, and wide markbooks like Reading Spring 2026 are converted automatically.
                </p>
                <button className="btn btn--primary" style={{ marginTop: 22 }} disabled={state === 'parsing'}>
                  {state === 'parsing' ? `Reading ${fileName}...` : 'Choose files'}
                </button>
                {error && (
                  <p style={{ color: 'var(--red)', marginTop: 16, fontSize: 13 }}>{error}</p>
                )}
              </div>
            </section>
          )}

          {state === 'confirming' && upload && summary && (
            <div className="attainment-upload-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 360px) minmax(0, 1fr)', gap: 18, alignItems: 'start' }}>
              <section style={panelStyle}>
                <p className="eyebrow">Detected</p>
                <h2 className="h3" style={{ marginTop: 8 }}>{upload.fileName}</h2>
                {isMultipleUpload && (
                  <p style={{ color: 'var(--ink-2)', fontSize: 13, lineHeight: 1.45, marginTop: 8 }}>
                    Combined from {sourceUploads.length} files.
                  </p>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 18 }}>
                  <Stat value={summary.rows} label="Rows read" />
                  <Stat value={summary.pupils} label="Pupils" />
                  <Stat value={summary.subjects.length} label="Subjects" />
                  <Stat value={summary.terms.length} label="Terms" />
                </div>
                <DetectedList label="Subjects" values={summary.subjects} />
                <DetectedList label="Terms" values={summary.terms} />
                <DetectedList label="Groups" values={summary.groups} empty="No pupil groups detected" />
                {upload.warnings.length > 0 && (
                  <div style={{ marginTop: 16, padding: 12, border: '1px solid var(--amber-line)', background: 'var(--amber-soft)', borderRadius: 8 }}>
                    {upload.warnings.map((warning) => (
                      <p key={warning} style={{ color: 'var(--amber)', fontSize: 12 }}>{warning}</p>
                    ))}
                  </div>
                )}
              </section>

              <section style={panelStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
                  <div>
                    <p className="eyebrow">Confirm columns</p>
                    <h2 className="h3" style={{ marginTop: 8 }}>{detectedRecords} attainment records ready</h2>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn--ghost" onClick={reset}>Start again</button>
                    <button className="btn btn--primary" onClick={confirmUpload} disabled={!canConfirm}>Use this data</button>
                  </div>
                </div>

                {isMultipleUpload ? (
                  <div style={{ marginTop: 20 }}>
                    <p className="field__label">Files included</p>
                    <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                      {sourceUploads.map((sourceUpload) => (
                        <SourceUploadReview
                          key={sourceUpload.id}
                          upload={sourceUpload}
                          onSubjectChange={(subject) => updateSourceUpload(renameUploadSubject(sourceUpload, subject))}
                          onTermChange={(fromTerm, toTerm) => updateSourceUpload(renameUploadTerm(sourceUpload, fromTerm, toTerm))}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginTop: 20 }}>
                      {[...requiredFields, ...optionalFields].map((field) => (
                        <label key={field} className="field">
                          <span className="field__label">{fieldLabels[field]}</span>
                          <select className="select" value={mapping[field] ?? ''} onChange={(event) => updateMapping(field, event.target.value)}>
                            <option value="">Not included</option>
                            {columns.map((column) => (
                              <option key={column} value={column}>{column}</option>
                            ))}
                          </select>
                        </label>
                      ))}
                    </div>

                    {mapping.wideAttainmentColumns && mapping.wideAttainmentColumns.length > 0 && (
                      <div style={{ marginTop: 18 }}>
                        <p className="field__label">Wide attainment columns</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                          {mapping.wideAttainmentColumns.map((column) => (
                            <span key={column} className="tag tag--blue">{column}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <PreviewTable rows={previewRows} columns={columns} />
                  </>
                )}
              </section>
            </div>
          )}

          {state === 'ready' && (
            <section style={{ ...panelStyle, textAlign: 'center' }}>
              <h2 className="h3">Dashboard ready</h2>
              <p style={{ color: 'var(--ink-2)', marginTop: 8 }}>Taking you to the dashboard...</p>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}

function DetectedList({ label, values, empty = 'None detected' }: { label: string; values: string[]; empty?: string }) {
  return (
    <div style={{ marginTop: 16 }}>
      <p className="field__label">{label}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
        {values.length > 0
          ? values.map((value) => <span key={value} className="tag">{value}</span>)
          : <span style={{ color: 'var(--ink-3)', fontSize: 13 }}>{empty}</span>}
      </div>
    </div>
  )
}

function PreviewTable({ rows, columns }: { rows: Record<string, string>[]; columns: string[] }) {
  return (
    <div style={{ marginTop: 22, overflowX: 'auto', border: '1px solid var(--line)', borderRadius: 8 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 720 }}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} style={thStyle}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 6).map((row, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td key={column} style={tdStyle}>{row[column]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SourceUploadReview({
  upload,
  onSubjectChange,
  onTermChange,
}: {
  upload: AttainmentUpload
  onSubjectChange: (subject: string) => void
  onTermChange: (fromTerm: string, toTerm: string) => void
}) {
  const subject = upload.detectedSummary.subjects[0] ?? ''

  return (
    <div style={{ padding: 12, border: '1px solid var(--line)', borderRadius: 8, background: 'var(--paper-2)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
        <span style={{ fontWeight: 600 }}>{upload.fileName}</span>
        <span style={{ color: 'var(--ink-2)', fontSize: 13 }}>{upload.records.length} records</span>
      </div>

      <label className="field">
        <span className="field__label">Subject</span>
        <input className="input" value={subject} onChange={(event) => onSubjectChange(event.target.value)} />
      </label>

      <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
        <p className="field__label">Terms</p>
        {upload.detectedSummary.terms.map((term) => (
          <input
            key={term}
            className="input"
            value={term}
            aria-label={`Term label for ${upload.fileName}`}
            onChange={(event) => onTermChange(term, event.target.value)}
          />
        ))}
      </div>

      {upload.warnings.length > 0 && (
        <div style={{ marginTop: 10, display: 'grid', gap: 4 }}>
          {upload.warnings.map((warning) => (
            <p key={warning} style={{ color: 'var(--amber)', fontSize: 12 }}>{warning}</p>
          ))}
        </div>
      )}
    </div>
  )
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div style={{ border: '1px solid var(--line)', background: 'var(--paper-2)', borderRadius: 8, padding: 12 }}>
      <div style={{ fontFamily: 'var(--f-display)', fontSize: 28, color: 'var(--ink)' }}>{value}</div>
      <div style={{ color: 'var(--ink-3)', fontSize: 12 }}>{label}</div>
    </div>
  )
}

function UploadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ink-2)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M17 8l-5-5-5 5" />
      <path d="M12 3v12" />
    </svg>
  )
}

const panelStyle: CSSProperties = {
  border: '1px solid var(--line)',
  background: 'var(--paper)',
  borderRadius: 8,
  padding: 20,
}

const thStyle: CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid var(--line)',
  textAlign: 'left',
  color: 'var(--ink-2)',
  background: 'var(--paper-2)',
  fontWeight: 600,
}

const tdStyle: CSSProperties = {
  padding: '9px 12px',
  borderBottom: '1px solid var(--line)',
  color: 'var(--ink)',
  whiteSpace: 'nowrap',
}
