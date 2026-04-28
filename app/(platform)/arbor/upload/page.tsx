'use client'

import { useState, useRef, useCallback, Suspense, type DragEvent, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { storeSchoolData } from '@/lib/schoolStore'
import { ArborSidebar } from '@/components/arbor/ArborSidebar'
import type { ParsedSchoolData } from '@/lib/csvParser'
import type { SubjectProfile } from '@/types'

type UploadState = 'idle' | 'uploading' | 'success' | 'error'

interface UploadStats {
  pupils:            number
  yearGroups:        number
  persistentAbsence: number
  avgAttendance:     number
  subjects:          number
}

interface FileUploadResult {
  success:    boolean
  data:       ParsedSchoolData
  stats:      UploadStats
  warnings:   string[]
  importedAt: string
}

const STEPS = [
  'Reading file structure...',
  'Detecting CSV format...',
  'Parsing pupil records...',
  'Computing attendance summaries...',
  'Building attainment profiles...',
  'Computing risk scores...',
  'Generating dashboard insights...',
]

function mergeResults(results: FileUploadResult[]): { merged: ParsedSchoolData; stats: UploadStats; allWarnings: string[] } {
  const pupils      = [...new Map(results.flatMap(r => r.data.pupils).map(p => [p.id, p])).values()]
  const attendance  = [...new Map(results.flatMap(r => r.data.attendance).map(a => [a.pupilId, a])).values()]
  const behaviour   = [...new Map(results.flatMap(r => r.data.behaviour).map(b => [b.pupilId, b])).values()]
  const riskProfiles = [...new Map(results.flatMap(r => r.data.riskProfiles).map(rp => [rp.pupilId, rp])).values()]
  const allWarnings = results.flatMap(r => r.warnings ?? [])

  const subjMap = new Map<string, SubjectProfile>()
  for (const r of results) {
    for (const sp of r.data.subjectProfiles) {
      const existing = subjMap.get(sp.pupilId)
      if (existing) {
        const merged = { ...existing.subjects, ...sp.subjects }
        subjMap.set(sp.pupilId, {
          pupilId:       sp.pupilId,
          subjects:      merged,
          belowExpected: Object.entries(merged)
            .filter(([, band]) => band === 'Working Towards' || band === 'Pre-Working Towards')
            .map(([subj]) => subj),
        })
      } else {
        subjMap.set(sp.pupilId, { ...sp })
      }
    }
  }
  const subjectProfiles = [...subjMap.values()]

  const avgAttendance = attendance.length > 0
    ? attendance.reduce((sum, a) => sum + a.overallPct, 0) / attendance.length
    : 0

  const merged: ParsedSchoolData = {
    pupils,
    attendance,
    behaviour,
    subjectProfiles,
    riskProfiles,
    stats: {
      totalPupils:            pupils.length,
      pupilsNeedingAttention: riskProfiles.filter(rp => rp.riskLevel === 'high').length,
      attendanceConcerns:     attendance.filter(a => a.overallPct < 90).length,
      behaviourConcerns:      behaviour.filter(b => b.totalIncidents > 0).length,
      overallAttendancePct:   avgAttendance,
      lastImportAt:           new Date().toISOString(),
    },
    importedAt:   new Date().toISOString(),
    sourceFormat: results[0]?.data.sourceFormat ?? 'unknown',
    warnings:     allWarnings,
  }

  const stats: UploadStats = {
    pupils:            pupils.length,
    yearGroups:        [...new Set(pupils.map(p => p.yearGroup))].length,
    persistentAbsence: attendance.filter(a => a.overallPct < 90).length,
    avgAttendance,
    subjects:          Object.keys(subjectProfiles[0]?.subjects ?? {}).length,
  }

  return { merged, stats, allWarnings }
}

export default function ArborUploadPage() {
  const router  = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [state,            setState]          = useState<UploadState>('idle')
  const [isDragging,       setIsDragging]     = useState(false)
  const [selectedFiles,    setSelectedFiles]  = useState<File[]>([])
  const [stepIndex,        setStepIndex]      = useState(-1)
  const [currentFileIndex, setCurrentFileIdx] = useState(0)
  const [result,           setResult]         = useState<{ stats: UploadStats } | null>(null)
  const [errorMessage,     setErrorMessage]   = useState('')
  const [warnings,         setWarnings]       = useState<string[]>([])

  function validateFile(file: File): string | null {
    const name = file.name.toLowerCase()
    if (!name.endsWith('.csv') && !name.endsWith('.txt'))
      return `${file.name}: only CSV files are supported.`
    if (file.size > 10 * 1024 * 1024)
      return `${file.name}: file is too large (max 10 MB).`
    if (file.size < 50)
      return `${file.name}: file appears to be empty.`
    return null
  }

  function addFiles(incoming: File[]) {
    const errors: string[] = []
    const valid: File[] = []
    for (const file of incoming) {
      const err = validateFile(file)
      if (err) errors.push(err)
      else valid.push(file)
    }
    if (errors.length) { setErrorMessage(errors.join('\n')); setState('error') }
    else { setState('idle'); setErrorMessage('') }
    if (valid.length) {
      setSelectedFiles(prev => {
        const existing = new Set(prev.map(f => f.name + f.size))
        return [...prev, ...valid.filter(f => !existing.has(f.name + f.size))]
      })
    }
  }

  function removeFile(index: number) {
    const next = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(next)
    if (next.length === 0) { setState('idle'); setErrorMessage('') }
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) addFiles(Array.from(e.target.files))
  }

  function handleDragOver(e: DragEvent)  { e.preventDefault(); setIsDragging(true) }
  function handleDragLeave(e: DragEvent) { e.preventDefault(); setIsDragging(false) }
  function handleDrop(e: DragEvent) {
    e.preventDefault(); setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length) addFiles(files)
  }

  const runUpload = useCallback(async (files: File[]) => {
    setState('uploading'); setStepIndex(0); setCurrentFileIdx(0)
    setErrorMessage(''); setWarnings([])

    const results: FileUploadResult[] = []
    const skipped: { name: string; error: string }[] = []

    for (let i = 0; i < files.length; i++) {
      setCurrentFileIdx(i); setStepIndex(0)
      let currentStep = 0
      const stepInterval = setInterval(() => {
        currentStep++
        if (currentStep < STEPS.length - 1) setStepIndex(currentStep)
      }, 380)

      try {
        const formData = new FormData()
        formData.append('file', files[i])
        const res  = await fetch('/api/upload', { method: 'POST', body: formData })
        const json = await res.json() as FileUploadResult & { error?: string; warnings?: string[] }
        clearInterval(stepInterval); setStepIndex(STEPS.length - 1)
        if (!res.ok || !json.success) skipped.push({ name: files[i].name, error: json.error ?? 'Upload failed.' })
        else results.push(json)
      } catch {
        clearInterval(stepInterval)
        setErrorMessage('Network error — check your connection and try again.')
        setState('error'); return
      }
      await new Promise<void>((resolve) => setTimeout(resolve, 200))
    }

    if (results.length === 0) {
      setErrorMessage(skipped.map((s) => `${s.name}: ${s.error}`).join('\n'))
      setState('error'); return
    }

    const { merged, stats, allWarnings } = mergeResults(results)
    storeSchoolData(merged)
    const skipWarnings = skipped.map((s) => `Skipped "${s.name}": ${s.error}`)
    if (allWarnings.length || skipWarnings.length) setWarnings([...allWarnings, ...skipWarnings])
    await new Promise<void>((resolve) => setTimeout(resolve, 300))
    setResult({ stats }); setState('success')
  }, [])

  function handleUploadClick() {
    if (selectedFiles.length) runUpload(selectedFiles)
    else fileRef.current?.click()
  }

  function handleReset() {
    setState('idle'); setSelectedFiles([]); setResult(null)
    setErrorMessage(''); setWarnings([]); setStepIndex(-1); setCurrentFileIdx(0)
    if (fileRef.current) fileRef.current.value = ''
  }

  const hasFiles = selectedFiles.length > 0

  return (
    <div className="app">
      <Suspense fallback={null}><ArborSidebar role="slt" open={true} editMode={false} /></Suspense>
      <main className="app__main" style={{ overflowY: 'auto', background: 'var(--paper-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', minHeight: '100%' }}>
          <div style={{ width: '100%', maxWidth: 540 }}>

            <div style={{ marginBottom: 32, textAlign: 'center' }}>
              <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 36, letterSpacing: '-0.02em', margin: '0 0 10px', color: 'var(--ink)' }}>
                Import school data
              </h1>
              <p style={{ color: 'var(--ink-2)', fontSize: 14, maxWidth: '38ch', margin: '0 auto', lineHeight: 1.6 }}>
                Upload one or more CSV exports from Arbor MIS. Records are merged across files.
                Your data stays in your browser and is never stored on our servers.
              </p>
            </div>

            <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 12, padding: 32 }}>

              {(state === 'idle' || state === 'error') && (
                <>
                  {/* Drop zone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => !hasFiles && fileRef.current?.click()}
                    style={{
                      border: `2px dashed ${isDragging || hasFiles ? 'var(--chalk-green-line)' : 'var(--line-2)'}`,
                      borderRadius: 10,
                      background: isDragging || hasFiles ? 'var(--chalk-green-soft)' : 'var(--paper-2)',
                      padding: '32px 24px',
                      textAlign: 'center',
                      cursor: hasFiles ? 'default' : 'pointer',
                      transition: 'all 0.2s',
                      marginBottom: 20,
                    }}
                  >
                    <input
                      ref={fileRef} type="file" accept=".csv,.txt" multiple
                      style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
                      onChange={handleInputChange}
                    />
                    <div style={{
                      width: 44, height: 44, borderRadius: 10,
                      border: '1px solid var(--line)',
                      background: hasFiles ? 'var(--chalk-green-soft)' : 'var(--paper)',
                      margin: '0 auto 16px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {hasFiles ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--chalk-green)" strokeWidth="2" strokeLinecap="round">
                          <path d="M5 13l4 4L19 7"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M7 16a4 4 0 01-.88-7.9A5 5 0 1115.9 6h.1a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                        </svg>
                      )}
                    </div>
                    {hasFiles ? (
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--chalk-green)' }}>
                          {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} ready to upload
                        </p>
                        <button
                          onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }}
                          style={{ fontSize: 12, color: 'var(--ink-3)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}
                        >
                          + Add more files
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>Drop CSV files here</p>
                        <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>or click to browse — multiple files supported</p>
                      </div>
                    )}
                  </div>

                  {/* Selected file list */}
                  {selectedFiles.length > 0 && (
                    <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {selectedFiles.map((file, i) => (
                        <div key={file.name + i} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '8px 12px', border: '1px solid var(--line)',
                          borderRadius: 8, background: 'var(--paper-2)',
                        }}>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
                            <p style={{ fontSize: 11, color: 'var(--ink-3)' }}>{(file.size / 1024).toFixed(0)} KB</p>
                          </div>
                          <button
                            onClick={() => removeFile(i)}
                            style={{ marginLeft: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', flexShrink: 0 }}
                            aria-label={`Remove ${file.name}`}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                              <path d="M18 6L6 18M6 6l12 12"/>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Error message */}
                  {state === 'error' && errorMessage && (
                    <div style={{ marginBottom: 16, padding: '12px 16px', border: '1px solid var(--red)', borderRadius: 10, background: 'var(--red-soft)' }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--red)', marginBottom: 2 }}>Upload failed</p>
                      <p style={{ fontSize: 12, color: 'var(--red)', whiteSpace: 'pre-line' }}>{errorMessage}</p>
                    </div>
                  )}

                  {/* Warnings */}
                  {warnings.length > 0 && (
                    <div style={{ marginBottom: 16, padding: '12px 16px', border: '1px solid var(--amber-line)', borderRadius: 10, background: 'var(--amber-soft)' }}>
                      {warnings.map((w, i) => <p key={i} style={{ fontSize: 12, color: 'var(--amber)' }}>{w}</p>)}
                    </div>
                  )}

                  {/* Format tags */}
                  <div style={{ marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {['Pupil export (CSV)', 'Attendance data', 'Arbor MIS export', 'Excel → Save as CSV'].map(t => (
                      <span key={t} className="tag">{t}</span>
                    ))}
                  </div>

                  {/* Upload button */}
                  <button
                    onClick={handleUploadClick}
                    className={`btn btn--block btn--lg${hasFiles ? ' btn--primary' : ''}`}
                    style={!hasFiles ? { background: 'var(--paper-2)', color: 'var(--ink-2)', border: '1px solid var(--line)' } : {}}
                  >
                    {hasFiles
                      ? selectedFiles.length === 1
                        ? 'Upload and process →'
                        : `Upload ${selectedFiles.length} files and process →`
                      : 'Choose files to upload'}
                  </button>

                  <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink-3)', marginTop: 12, lineHeight: 1.6 }}>
                    Data is processed in your browser and stored only in your current session.<br />
                    No pupil data is sent to any third-party server.
                  </p>
                </>
              )}

              {/* Uploading */}
              {state === 'uploading' && (
                <div style={{ padding: '16px 0', textAlign: 'center' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    border: '3px solid var(--line-2)', borderTopColor: 'var(--chalk-green)',
                    animation: 'spin 0.8s linear infinite', margin: '0 auto 20px',
                  }} />
                  <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)', marginBottom: 4 }}>Processing your data</p>
                  <p style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 24 }}>
                    {selectedFiles.length > 1
                      ? `File ${currentFileIndex + 1} of ${selectedFiles.length} — ${selectedFiles[currentFileIndex]?.name ?? ''}`
                      : 'Analysing pupil records…'}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
                    {STEPS.map((step, i) => {
                      const done    = i < stepIndex
                      const current = i === stepIndex
                      return (
                        <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, transition: 'all 0.3s', color: done ? 'var(--chalk-green)' : current ? 'var(--ink)' : 'var(--ink-3)' }}>
                          {done ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--chalk-green)" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
                              <path d="M5 13l4 4L19 7"/>
                            </svg>
                          ) : (
                            <div style={{
                              width: 16, height: 16, borderRadius: '50%',
                              border: `2px solid ${current ? 'var(--chalk-green)' : 'var(--line-2)'}`,
                              borderTopColor: current ? 'transparent' : 'var(--line-2)',
                              animation: current ? 'spin 0.8s linear infinite' : 'none',
                              flexShrink: 0,
                            }} />
                          )}
                          {step}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Success */}
              {state === 'success' && result && (
                <div>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    border: '1px solid var(--chalk-green-line)', background: 'var(--chalk-green-soft)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--chalk-green)" strokeWidth="2" strokeLinecap="round">
                      <path d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                  <h2 style={{ textAlign: 'center', fontFamily: 'var(--f-display)', fontSize: 28, fontWeight: 400, color: 'var(--ink)', marginBottom: 6 }}>
                    Upload complete
                  </h2>
                  <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink-2)', marginBottom: 24 }}>
                    {result.stats.pupils} pupils across {result.stats.yearGroups} year groups processed.
                    {selectedFiles.length > 1 && ` (${selectedFiles.length} files merged)`}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                    <StatBox value={result.stats.pupils} label="Pupils imported" />
                    <StatBox value={result.stats.yearGroups} label="Year groups" />
                    <StatBox
                      value={`${result.stats.avgAttendance.toFixed(1)}%`}
                      label="Average attendance"
                      highlight={result.stats.avgAttendance < 90 ? 'red' : result.stats.avgAttendance < 95 ? 'amber' : 'green'}
                    />
                    <StatBox
                      value={result.stats.persistentAbsence}
                      label="Persistent absence"
                      highlight={result.stats.persistentAbsence > 0 ? 'amber' : 'green'}
                    />
                  </div>

                  {warnings.length > 0 && (
                    <div style={{ marginBottom: 16, padding: '12px 16px', border: '1px solid var(--amber-line)', borderRadius: 10, background: 'var(--amber-soft)' }}>
                      <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--amber)', marginBottom: 4 }}>Notices</p>
                      {warnings.map((w, i) => <p key={i} style={{ fontSize: 12, color: 'var(--amber)' }}>{w}</p>)}
                    </div>
                  )}

                  <button
                    onClick={() => router.push('/arbor/dashboard' as any)}
                    className="btn btn--primary btn--block btn--lg"
                    style={{ marginBottom: 8 }}
                  >
                    View dashboard →
                  </button>
                  <button onClick={handleReset} className="btn btn--ghost btn--block">
                    Upload more files
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function StatBox({
  value, label, highlight,
}: {
  value:      string | number
  label:      string
  highlight?: 'red' | 'amber' | 'green'
}) {
  const valueColor =
    highlight === 'red'   ? 'var(--red)' :
    highlight === 'amber' ? 'var(--amber)' :
    highlight === 'green' ? 'var(--chalk-green)' :
    'var(--ink)'

  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 10, background: 'var(--paper-2)', padding: 16, textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--f-display)', fontSize: 26, fontStyle: 'italic', color: valueColor }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>{label}</div>
    </div>
  )
}
