'use client'

import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { storeSchoolData } from '@/lib/schoolStore'
import type { ParsedSchoolData } from '@/lib/csvParser'

// ── Types ─────────────────────────────────────────────────────

type UploadState = 'idle' | 'uploading' | 'success' | 'error'

interface UploadStats {
  pupils:            number
  yearGroups:        number
  persistentAbsence: number
  avgAttendance:     number
  subjects:          number
}

interface UploadResult {
  success:    boolean
  data:       ParsedSchoolData
  stats:      UploadStats
  warnings:   string[]
  importedAt: string
}

// ── Processing steps ──────────────────────────────────────────

const STEPS = [
  'Reading file structure...',
  'Detecting CSV format...',
  'Parsing pupil records...',
  'Computing attendance summaries...',
  'Building attainment profiles...',
  'Computing risk scores...',
  'Generating dashboard insights...',
]

// ── Component ─────────────────────────────────────────────────

export default function UploadPage() {
  const router  = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [state,          setState]         = useState<UploadState>('idle')
  const [isDragging,     setIsDragging]    = useState(false)
  const [selectedFiles,  setSelectedFiles] = useState<File[]>([])
  const [stepIndex,      setStepIndex]     = useState(-1)
  const [currentFileIdx, setCurrentFileIdx] = useState(0)
  const [result,         setResult]        = useState<UploadResult | null>(null)
  const [errorMessage,   setErrorMessage]  = useState('')
  const [warnings,       setWarnings]      = useState<string[]>([])

  // ── File validation ──────────────────────────────────────────

  function validateFile(file: File): string | null {
    const name = file.name.toLowerCase()
    if (!name.endsWith('.csv') && !name.endsWith('.txt')) {
      return `"${file.name}" is not a CSV file. Save Excel files as CSV first via File → Save As → CSV.`
    }
    if (file.size > 10 * 1024 * 1024) {
      return `"${file.name}" is too large (max 10 MB). Please check you are uploading a CSV export, not a full database.`
    }
    if (file.size < 50) {
      return `"${file.name}" appears to be empty.`
    }
    return null
  }

  function addFiles(incoming: File[]) {
    const errors: string[] = []
    const valid: File[] = []

    for (const file of incoming) {
      const err = validateFile(file)
      if (err) { errors.push(err); continue }
      valid.push(file)
    }

    if (errors.length) {
      setErrorMessage(errors.join('\n'))
      setState('error')
    } else {
      setState('idle')
      setErrorMessage('')
    }

    if (valid.length) {
      setSelectedFiles(prev => {
        // Deduplicate by name
        const existing = new Set(prev.map(f => f.name))
        return [...prev, ...valid.filter(f => !existing.has(f.name))]
      })
    }
  }

  function removeFile(index: number) {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setState('idle')
    setErrorMessage('')
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) addFiles(Array.from(e.target.files))
    // Reset input so the same file can be re-added after removal
    e.target.value = ''
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }
  function handleDragLeave(e: DragEvent) {
    e.preventDefault()
    setIsDragging(false)
  }
  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length) addFiles(files)
  }

  // ── Upload ───────────────────────────────────────────────────

  const runUpload = useCallback(async (files: File[]) => {
    setState('uploading')
    setStepIndex(0)
    setCurrentFileIdx(0)
    setErrorMessage('')
    setWarnings([])

    let mergedData: ParsedSchoolData | null = null
    const allWarnings: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setCurrentFileIdx(i)
      setStepIndex(0)

      // Animate steps for this file
      let currentStep = 0
      const stepInterval = setInterval(() => {
        currentStep++
        if (currentStep < STEPS.length - 1) {
          setStepIndex(currentStep)
        }
      }, 380)

      try {
        const formData = new FormData()
        formData.append('file', file)

        const res  = await fetch('/api/upload', { method: 'POST', body: formData })
        const json = await res.json() as UploadResult & { error?: string; warnings?: string[] }

        clearInterval(stepInterval)
        setStepIndex(STEPS.length - 1)

        if (!res.ok || !json.success) {
          setErrorMessage(`Failed on "${file.name}": ${json.error ?? 'Upload failed. Please try again.'}`)
          if (json.warnings?.length) setWarnings(json.warnings)
          setState('error')
          return
        }

        if (json.warnings?.length) allWarnings.push(...json.warnings)

        // Merge data from multiple files
        mergedData = mergedData
          ? mergeSchoolData(mergedData, json.data)
          : json.data

        await new Promise<void>((res) => setTimeout(res, 300))
      } catch {
        clearInterval(stepInterval)
        setErrorMessage(`Network error while uploading "${file.name}" — check your connection and try again.`)
        setState('error')
        return
      }
    }

    if (!mergedData) return

    storeSchoolData(mergedData)
    setWarnings(allWarnings)

    const stats = computeStats(mergedData)
    setResult({
      success:    true,
      data:       mergedData,
      stats,
      warnings:   allWarnings,
      importedAt: new Date().toISOString(),
    })
    setState('success')
  }, [])

  function handleUploadClick() {
    if (selectedFiles.length) {
      runUpload(selectedFiles)
    } else {
      fileRef.current?.click()
    }
  }

  function handleReset() {
    setState('idle')
    setSelectedFiles([])
    setResult(null)
    setErrorMessage('')
    setWarnings([])
    setStepIndex(-1)
    setCurrentFileIdx(0)
    if (fileRef.current) fileRef.current.value = ''
  }

  // ── Render ───────────────────────────────────────────────────

  const hasFiles = selectedFiles.length > 0

  return (
    <div className="min-h-screen bg-stone-50">

      {/* Minimal header */}
      <header className="bg-white border-b border-stone-200 h-[52px] flex items-center justify-between px-6">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
            <GridIcon />
          </div>
          <span className="font-semibold text-[15px] text-stone-900">Arbor AI</span>
        </Link>
        <Link href="/dashboard" className="text-sm text-stone-400 hover:text-stone-700 transition-colors">
          Back to dashboard →
        </Link>
      </header>

      {/* Main */}
      <main className="flex items-center justify-center min-h-[calc(100vh-52px)] px-4 py-12">
        <div className="w-full max-w-[540px]">

          {/* Page title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-stone-900 mb-2">Import school data</h1>
            <p className="text-sm text-stone-500 max-w-sm mx-auto leading-relaxed">
              Upload one or more CSV exports from Arbor MIS. Multiple files are merged automatically.
              Your data stays in your browser and is never stored on our servers.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-card-md p-8">

            {/* ── Idle / file selected ── */}
            {(state === 'idle' || state === 'error') && (
              <>
                {/* Drop zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !hasFiles && fileRef.current?.click()}
                  className={cn(
                    'relative flex flex-col items-center justify-center gap-3 rounded-xl',
                    'border-2 border-dashed px-6 py-10 transition-all duration-200 mb-4',
                    hasFiles
                      ? 'border-brand-300 bg-brand-50 cursor-default'
                      : isDragging
                      ? 'border-brand-400 bg-brand-50 scale-[1.01]'
                      : 'border-stone-200 bg-stone-50 hover:border-brand-300 hover:bg-brand-50/60 cursor-pointer',
                  )}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,.txt"
                    multiple
                    className="sr-only"
                    onChange={handleInputChange}
                  />

                  <div className={cn(
                    'w-11 h-11 rounded-xl flex items-center justify-center',
                    hasFiles ? 'bg-brand-100' : 'bg-white border border-stone-200',
                  )}>
                    {hasFiles ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1B5E3B" strokeWidth="2" strokeLinecap="round">
                        <path d="M5 13l4 4L19 7"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                      </svg>
                    )}
                  </div>

                  {hasFiles ? (
                    <p className="text-sm font-medium text-brand-700">
                      {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                    </p>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm font-medium text-stone-700">Drop CSV files here</p>
                      <p className="text-xs text-stone-400 mt-1">or click to browse · multiple files supported</p>
                    </div>
                  )}
                </div>

                {/* File list */}
                {hasFiles && (
                  <ul className="mb-4 space-y-2">
                    {selectedFiles.map((file, i) => (
                      <li
                        key={file.name}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-stone-50 border border-stone-100"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                          </svg>
                          <span className="text-xs font-medium text-stone-700 truncate">{file.name}</span>
                          <span className="text-xs text-stone-400 flex-shrink-0">{(file.size / 1024).toFixed(0)} KB</span>
                        </div>
                        <button
                          onClick={() => removeFile(i)}
                          className="text-stone-300 hover:text-red-400 transition-colors flex-shrink-0"
                          aria-label={`Remove ${file.name}`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </li>
                    ))}
                    {/* Add more files button */}
                    <li>
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-stone-200 text-xs text-stone-400 hover:border-brand-300 hover:text-brand-600 transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Add another file
                      </button>
                    </li>
                  </ul>
                )}

                {/* Error message */}
                {state === 'error' && errorMessage && (
                  <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                    <p className="text-sm text-red-700 font-medium mb-0.5">Upload failed</p>
                    {errorMessage.split('\n').map((line, i) => (
                      <p key={i} className="text-xs text-red-600">{line}</p>
                    ))}
                  </div>
                )}

                {/* Warnings from previous attempt */}
                {warnings.length > 0 && (
                  <div className="mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
                    {warnings.map((w, i) => (
                      <p key={i} className="text-xs text-amber-700">{w}</p>
                    ))}
                  </div>
                )}

                {/* Format tags */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {['Pupil export (CSV)', 'Attendance data', 'Arbor MIS export', 'Excel → Save as CSV'].map((t) => (
                    <span key={t} className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-stone-100 text-stone-500 border border-stone-200">
                      {t}
                    </span>
                  ))}
                </div>

                {/* Upload button */}
                <button
                  onClick={handleUploadClick}
                  className={cn(
                    'w-full py-3 rounded-xl text-sm font-medium transition-all duration-150',
                    hasFiles
                      ? 'bg-brand-500 text-white hover:bg-brand-600'
                      : 'bg-stone-100 text-stone-500 hover:bg-stone-200',
                  )}
                >
                  {hasFiles
                    ? `Upload and process ${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''} →`
                    : 'Choose files to upload'}
                </button>

                <p className="text-xs text-stone-400 text-center mt-3">
                  Data is processed in your browser and stored only in your current session.
                  <br />No pupil data is sent to any third-party server.
                </p>
              </>
            )}

            {/* ── Uploading ── */}
            {state === 'uploading' && (
              <div className="text-center py-4">
                <div className="w-9 h-9 rounded-full border-[3px] border-stone-200 border-t-brand-500 animate-spin mx-auto mb-5" />
                <p className="text-[15px] font-medium text-stone-900 mb-1">Processing your data</p>
                {selectedFiles.length > 1 && (
                  <p className="text-xs text-brand-600 font-medium mb-0.5">
                    File {currentFileIdx + 1} of {selectedFiles.length}: {selectedFiles[currentFileIdx]?.name}
                  </p>
                )}
                <p className="text-xs text-stone-400 mb-6">Analysing pupil records…</p>

                <div className="text-left space-y-2.5">
                  {STEPS.map((step, i) => {
                    const done    = i < stepIndex
                    const current = i === stepIndex
                    return (
                      <div key={step} className={cn(
                        'flex items-center gap-2.5 text-sm transition-all duration-300',
                        done    ? 'text-brand-600' :
                        current ? 'text-stone-700' : 'text-stone-300',
                      )}>
                        {done ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1B5E3B" strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0">
                            <path d="M5 13l4 4L19 7"/>
                          </svg>
                        ) : (
                          <div className={cn(
                            'w-4 h-4 rounded-full border-2 flex-shrink-0',
                            current ? 'border-brand-400 border-t-transparent animate-spin' : 'border-stone-200',
                          )} />
                        )}
                        {step}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Success ── */}
            {state === 'success' && result && (
              <div>
                <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center mx-auto mb-4">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1B5E3B" strokeWidth="2" strokeLinecap="round">
                    <path d="M5 13l4 4L19 7"/>
                  </svg>
                </div>

                <h2 className="text-lg font-semibold text-stone-900 text-center mb-1">Upload complete</h2>
                <p className="text-sm text-stone-500 text-center mb-6">
                  {result.stats.pupils} pupils across {result.stats.yearGroups} year groups processed successfully
                  {selectedFiles.length > 1 ? ` from ${selectedFiles.length} files` : ''}.
                </p>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <StatBox value={result.stats.pupils}      label="Pupils imported" />
                  <StatBox value={result.stats.yearGroups}  label="Year groups" />
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

                {/* Warnings */}
                {warnings.length > 0 && (
                  <div className="mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
                    <p className="text-xs font-medium text-amber-700 mb-1">Notices</p>
                    {warnings.map((w, i) => (
                      <p key={i} className="text-xs text-amber-600">{w}</p>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full py-3 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors mb-2"
                >
                  View dashboard →
                </button>
                <button
                  onClick={handleReset}
                  className="w-full py-2 rounded-xl text-sm text-stone-400 hover:text-stone-600 transition-colors"
                >
                  Upload more files
                </button>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────

/**
 * Merge two ParsedSchoolData objects by concatenating their pupil arrays.
 * Duplicate pupils (same id) from the second file are skipped.
 */
function mergeSchoolData(a: ParsedSchoolData, b: ParsedSchoolData): ParsedSchoolData {
  const existingIds = new Set(a.pupils.map((p: any) => p.id ?? p.upn ?? p.name))
  const newPupils   = b.pupils.filter((p: any) => !existingIds.has(p.id ?? p.upn ?? p.name))
  return {
    ...a,
    pupils: [...a.pupils, ...newPupils],
  }
}

/**
 * Re-compute summary stats from merged ParsedSchoolData so the success screen
 * reflects the combined dataset rather than only the last file's API response.
 */
function computeStats(data: ParsedSchoolData): {
  pupils: number; yearGroups: number; persistentAbsence: number; avgAttendance: number; subjects: number
} {
  const pupils = data.pupils ?? []
  const yearGroups = new Set(pupils.map((p: any) => p.yearGroup ?? p.year_group ?? '')).size
  const attendances = pupils
    .map((p: any) => parseFloat(p.attendancePercent ?? p.attendance ?? '0'))
    .filter((n: number) => !isNaN(n))
  const avgAttendance = attendances.length
    ? attendances.reduce((a: number, b: number) => a + b, 0) / attendances.length
    : 0
  const persistentAbsence = pupils.filter(
    (p: any) => parseFloat(p.attendancePercent ?? p.attendance ?? '100') < 90
  ).length
  return { pupils: pupils.length, yearGroups, persistentAbsence, avgAttendance, subjects: 0 }
}

// ── Sub-components ────────────────────────────────────────────

function StatBox({
  value, label, highlight,
}: {
  value: string | number
  label: string
  highlight?: 'red' | 'amber' | 'green'
}) {
  const valueColor =
    highlight === 'red'   ? 'text-red-600'   :
    highlight === 'amber' ? 'text-amber-600' :
    highlight === 'green' ? 'text-green-700' :
    'text-stone-900'

  return (
    <div className="bg-stone-50 rounded-xl p-4 text-center border border-stone-100">
      <div className={cn('text-2xl font-semibold tabular-nums', valueColor)}>{value}</div>
      <div className="text-xs text-stone-400 mt-1">{label}</div>
    </div>
  )
}

function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="white">
      <rect x="1" y="1" width="5" height="5" rx="1"/>
      <rect x="8" y="1" width="5" height="5" rx="1"/>
      <rect x="1" y="8" width="5" height="5" rx="1"/>
      <rect x="8" y="8" width="5" height="5" rx="1"/>
    </svg>
  )
}
