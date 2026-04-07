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
  pupils:           number
  yearGroups:       number
  persistentAbsence: number
  avgAttendance:    number
  subjects:         number
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
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [state,          setState]         = useState<UploadState>('idle')
  const [isDragging,     setIsDragging]    = useState(false)
  const [selectedFile,   setSelectedFile]  = useState<File | null>(null)
  const [stepIndex,      setStepIndex]     = useState(-1)
  const [result,         setResult]        = useState<UploadResult | null>(null)
  const [errorMessage,   setErrorMessage]  = useState('')
  const [warnings,       setWarnings]      = useState<string[]>([])

  // ── File validation ──────────────────────────────────────────

  function validateFile(file: File): string | null {
    const name = file.name.toLowerCase()
    if (!name.endsWith('.csv') && !name.endsWith('.txt')) {
      return 'Please upload a CSV file. To use an Excel file, save it as CSV first via File → Save As → CSV.'
    }
    if (file.size > 10 * 1024 * 1024) {
      return 'File is too large (max 10 MB). Please check you are uploading a CSV export, not a full database.'
    }
    if (file.size < 50) {
      return 'File appears to be empty.'
    }
    return null
  }

  function handleFileSelect(file: File) {
    const err = validateFile(file)
    if (err) {
      setErrorMessage(err)
      setState('error')
      return
    }
    setSelectedFile(file)
    setState('idle')
    setErrorMessage('')
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) handleFileSelect(e.target.files[0])
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
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  // ── Upload ───────────────────────────────────────────────────

  const runUpload = useCallback(async (file: File) => {
    setState('uploading')
    setStepIndex(0)
    setErrorMessage('')
    setWarnings([])

    // Animate steps while the real upload happens
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

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const json = await res.json() as UploadResult & { error?: string; warnings?: string[] }

      clearInterval(stepInterval)
      setStepIndex(STEPS.length - 1)

      if (!res.ok || !json.success) {
        setErrorMessage(json.error ?? 'Upload failed. Please try again.')
        if (json.warnings?.length) setWarnings(json.warnings)
        setState('error')
        return
      }

      // Store parsed data client-side for the dashboard to read
      storeSchoolData(json.data)

      if (json.warnings?.length) setWarnings(json.warnings)

      // Brief pause so final step is visible before showing success
      await new Promise<void>((res) => setTimeout(res, 300))

      setResult(json)
      setState('success')
    } catch (err) {
      clearInterval(stepInterval)
      setErrorMessage('Network error — check your connection and try again.')
      setState('error')
    }
  }, [])

  function handleUploadClick() {
    if (selectedFile) {
      runUpload(selectedFile)
    } else {
      fileRef.current?.click()
    }
  }

  function handleReset() {
    setState('idle')
    setSelectedFile(null)
    setResult(null)
    setErrorMessage('')
    setWarnings([])
    setStepIndex(-1)
    if (fileRef.current) fileRef.current.value = ''
  }

  // ── Render ───────────────────────────────────────────────────

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
              Upload a CSV export from Arbor MIS or any school data spreadsheet.
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
                  onClick={() => !selectedFile && fileRef.current?.click()}
                  className={cn(
                    'relative flex flex-col items-center justify-center gap-3 rounded-xl',
                    'border-2 border-dashed px-6 py-10 transition-all duration-200 mb-5',
                    selectedFile
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
                    className="sr-only"
                    onChange={handleInputChange}
                  />

                  <div className={cn(
                    'w-11 h-11 rounded-xl flex items-center justify-center',
                    selectedFile ? 'bg-brand-100' : 'bg-white border border-stone-200',
                  )}>
                    {selectedFile ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1B5E3B" strokeWidth="2" strokeLinecap="round">
                        <path d="M5 13l4 4L19 7"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                      </svg>
                    )}
                  </div>

                  {selectedFile ? (
                    <div className="text-center">
                      <p className="text-sm font-medium text-brand-700">{selectedFile.name}</p>
                      <p className="text-xs text-stone-400 mt-1">
                        {(selectedFile.size / 1024).toFixed(0)} KB · ready to upload
                      </p>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleReset() }}
                        className="text-xs text-stone-400 hover:text-red-500 mt-2 transition-colors"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm font-medium text-stone-700">Drop your CSV file here</p>
                      <p className="text-xs text-stone-400 mt-1">or click to browse</p>
                    </div>
                  )}
                </div>

                {/* Error message */}
                {state === 'error' && errorMessage && (
                  <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                    <p className="text-sm text-red-700 font-medium mb-0.5">Upload failed</p>
                    <p className="text-xs text-red-600">{errorMessage}</p>
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
                    selectedFile
                      ? 'bg-brand-500 text-white hover:bg-brand-600'
                      : 'bg-stone-100 text-stone-500 hover:bg-stone-200',
                  )}
                >
                  {selectedFile ? 'Upload and process →' : 'Choose a file to upload'}
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
                <div
                  className="w-9 h-9 rounded-full border-[3px] border-stone-200 border-t-brand-500 animate-spin mx-auto mb-5"
                />
                <p className="text-[15px] font-medium text-stone-900 mb-1">Processing your data</p>
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
                  {result.stats.pupils} pupils across {result.stats.yearGroups} year groups processed successfully.
                </p>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3 mb-5">
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
                  Upload another file
                </button>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  )
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
    highlight === 'red'   ? 'text-red-600' :
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
