'use client'

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import type { Route } from 'next'
import Link from 'next/link'
import { ArborSidebar } from '@/components/arbor/ArborSidebar'
import {
  calculatePupilMovement,
  groupBySubject,
  summariseAttainment,
  uniqueValues,
  type AttainmentRecord,
} from '@/lib/analytics/attainment'
import { getAttainmentUploads, type AttainmentUpload } from '@/lib/attainmentStore'

export function AttainmentPupilDetailClient({ pupilId, uploadId }: { pupilId: string; uploadId?: string }) {
  const [uploads, setUploads] = useState<AttainmentUpload[]>([])

  useEffect(() => {
    getAttainmentUploads().then(setUploads).catch(() => setUploads([]))
  }, [])

  const upload = uploads.find((item) => item.id === uploadId) ?? uploads[0] ?? null
  const records = useMemo(
    () => (upload?.records ?? []).filter((record) => (record.pupilId || record.pupilName) === pupilId),
    [pupilId, upload],
  )
  const pupilName = records[0]?.pupilName ?? decodeURIComponent(pupilId)
  const summary = summariseAttainment(records)
  const subjects = groupBySubject(records)
  const terms = uniqueValues(records, 'term').sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  const movement = terms.length >= 2 ? calculatePupilMovement(records, terms[terms.length - 2], terms[terms.length - 1]) : []

  return (
    <div className="app">
      <ArborSidebar role="slt" open={true} editMode={false} />
      <main className="app__main" style={{ overflowY: 'auto', background: 'var(--paper-2)' }}>
        <div style={{ width: '100%', maxWidth: 980, margin: '0 auto', padding: '28px 24px 56px' }}>
          <Link href="/arbor/dashboard" style={{ color: 'var(--ink-3)', fontSize: 13 }}>Back to dashboard</Link>
          <header style={{ marginTop: 18, marginBottom: 18 }}>
            <p className="eyebrow">Pupil detail</p>
            <h1 className="h1" style={{ marginTop: 8 }}>{pupilName}</h1>
            <p style={{ color: 'var(--ink-2)', marginTop: 8 }}>{records[0]?.yearGroup ?? 'Year group unavailable'} · {records[0]?.className ?? 'Class unavailable'}</p>
          </header>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
            <Metric label="Expected or above" value={`${summary.exsPlusPct}%`} />
            <Metric label="Greater depth" value={`${summary.gdsPct}%`} />
            <Metric label="Below expected" value={`${summary.belowExpectedPct}%`} />
            <Metric label="Records" value={records.length} />
          </section>

          <section style={{ display: 'grid', gap: 16 }}>
            <Panel title="Subjects">
              <table style={tableStyle}>
                <thead><tr><th style={thStyle}>Subject</th><th style={thStyle}>Expected or above</th><th style={thStyle}>Greater depth</th><th style={thStyle}>Latest band</th></tr></thead>
                <tbody>
                  {Object.entries(subjects).map(([subject, subjectSummary]) => {
                    const latest = records.filter((record) => record.subject === subject).sort((a, b) => b.term.localeCompare(a.term))[0]
                    return (
                      <tr key={subject}>
                        <td style={tdStyle}><Link href={`/arbor/subjects/${encodeURIComponent(subject)}?uploadId=${encodeURIComponent(upload?.id ?? '')}` as Route}>{subject}</Link></td>
                        <td style={tdStyle}>{subjectSummary.exsPlusPct}%</td>
                        <td style={tdStyle}>{subjectSummary.gdsPct}%</td>
                        <td style={tdStyle}>{latest?.attainmentBand ?? '-'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </Panel>

            <Panel title="Term history">
              <table style={tableStyle}>
                <thead><tr><th style={thStyle}>Term</th><th style={thStyle}>Subject</th><th style={thStyle}>Band</th></tr></thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id}><td style={tdStyle}>{record.term}</td><td style={tdStyle}>{record.subject}</td><td style={tdStyle}>{record.attainmentBand}</td></tr>
                  ))}
                </tbody>
              </table>
            </Panel>

            <Panel title="Movement">
              {movement.length === 0 ? (
                <p style={mutedStyle}>Movement is not available for this pupil unless there are matching subjects across at least two terms.</p>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {movement.map((item) => (
                    <div key={`${item.subject}-${item.fromTerm}-${item.toTerm}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <span>{item.subject}</span>
                      <strong>{item.fromBand} to {item.toBand} · {item.movement}</strong>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </section>
        </div>
      </main>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section style={panelStyle}><h2 style={{ fontSize: 20, fontWeight: 650, marginBottom: 14 }}>{title}</h2>{children}</section>
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <section style={panelStyle}><p className="field__label">{label}</p><div style={{ fontFamily: 'var(--f-display)', fontSize: 36 }}>{value}</div></section>
}

const panelStyle: CSSProperties = { border: '1px solid var(--line)', background: 'var(--paper)', borderRadius: 8, padding: 18 }
const mutedStyle: CSSProperties = { color: 'var(--ink-2)', fontSize: 13, lineHeight: 1.5 }
const tableStyle: CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 13 }
const thStyle: CSSProperties = { padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--line)', color: 'var(--ink-2)' }
const tdStyle: CSSProperties = { padding: '10px 12px', borderBottom: '1px solid var(--line)' }
