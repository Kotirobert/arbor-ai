'use client'

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import Link from 'next/link'
import { ArborSidebar } from '@/components/arbor/ArborSidebar'
import {
  calculatePupilMovement,
  countUniquePupils,
  getInterventionCandidates,
  groupByDemographic,
  groupByTerm,
  summariseAttainment,
  uniqueValues,
  type AttainmentRecord,
} from '@/lib/analytics/attainment'
import { generateInsights } from '@/lib/analytics/insights'
import { getAttainmentUploads, type AttainmentUpload } from '@/lib/attainmentStore'

export function AttainmentSubjectDetailClient({ subject, uploadId }: { subject: string; uploadId?: string }) {
  const [uploads, setUploads] = useState<AttainmentUpload[]>([])

  useEffect(() => {
    getAttainmentUploads().then(setUploads).catch(() => setUploads([]))
  }, [])

  const upload = uploads.find((item) => item.id === uploadId) ?? uploads[0] ?? null
  const records = useMemo(
    () => (upload?.records ?? []).filter((record) => record.subject === subject),
    [subject, upload],
  )
  const summary = summariseAttainment(records)
  const byTerm = groupByTerm(records)
  const insights = generateInsights(records)
  const terms = uniqueValues(records, 'term').sort(compareTerms)
  const movement = terms.length >= 2 ? calculatePupilMovement(records, terms[terms.length - 2], terms[terms.length - 1]) : []
  const interventions = getInterventionCandidates(records, movement)

  return (
    <div className="app">
      <ArborSidebar role="slt" open={true} editMode={false} />
      <main className="app__main" style={{ overflowY: 'auto', background: 'var(--paper-2)' }}>
        <div style={{ width: '100%', maxWidth: 1180, margin: '0 auto', padding: '28px 24px 56px' }}>
          <Link href="/arbor/dashboard" style={{ color: 'var(--ink-3)', fontSize: 13 }}>Back to dashboard</Link>
          <header style={{ marginTop: 18, marginBottom: 18 }}>
            <p className="eyebrow">Subject detail</p>
            <h1 className="h1" style={{ marginTop: 8 }}>{subject}</h1>
            <p style={{ color: 'var(--ink-2)', marginTop: 8 }}>
              {countUniquePupils(records)} pupils, {records.length} attainment records, {terms.length} terms.
            </p>
          </header>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
            <Metric label="Expected or above" value={`${summary.exsPlusPct}%`} />
            <Metric label="Greater depth" value={`${summary.gdsPct}%`} />
            <Metric label="Below expected" value={`${summary.belowExpectedPct}%`} />
            <Metric label="Pupils needing support" value={interventions.length} />
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(280px, 0.8fr)', gap: 16 }}>
            <div style={{ display: 'grid', gap: 16 }}>
              <Panel title="Term trend">
                <table style={tableStyle}>
                  <thead><tr><th style={thStyle}>Term</th><th style={thStyle}>Expected or above</th><th style={thStyle}>Greater depth</th><th style={thStyle}>Records</th></tr></thead>
                  <tbody>
                    {Object.entries(byTerm).map(([term, termSummary]) => (
                      <tr key={term}>
                        <td style={tdStyle}>{term}</td>
                        <td style={tdStyle}>{termSummary.exsPlusPct}%</td>
                        <td style={tdStyle}>{termSummary.gdsPct}%</td>
                        <td style={tdStyle}>{termSummary.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Panel>

              <Panel title="Pupils below expected">
                <PupilList records={records.filter((record) => record.attainmentBand === 'PRE' || record.attainmentBand === 'WTS')} uploadId={upload?.id ?? ''} />
              </Panel>

              <Panel title="Pupil movement">
                {movement.length === 0 ? (
                  <p style={mutedStyle}>Movement is not available unless the subject has matching pupils across at least two terms.</p>
                ) : (
                  <PupilList records={records.filter((record) => movement.some((item) => item.pupilName === record.pupilName && item.movement === 'down'))} uploadId={upload?.id ?? ''} />
                )}
              </Panel>
            </div>

            <aside style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
              <Panel title="Insights">
                <div style={{ display: 'grid', gap: 8 }}>
                  {insights.map((insight) => <p key={insight.text} style={{ ...mutedStyle, margin: 0 }}>{insight.text}</p>)}
                </div>
              </Panel>

              <Panel title="Sex comparison">
                <SummaryGroups groups={groupByDemographic(records, 'sex')} />
              </Panel>
            </aside>
          </section>
        </div>
      </main>
    </div>
  )
}

function PupilList({ records, uploadId }: { records: AttainmentRecord[]; uploadId: string }) {
  const rows = [...new Map(records.map((record) => [record.pupilId || record.pupilName, record])).values()]
  if (rows.length === 0) return <p style={mutedStyle}>No pupils to show.</p>
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {rows.map((record) => (
        <Link key={`${record.pupilId}-${record.subject}-${record.term}`} href={`/arbor/pupil/${encodeURIComponent(record.pupilId || record.pupilName)}?uploadId=${encodeURIComponent(uploadId)}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid var(--line)', paddingBottom: 8 }}>
          <span>{record.pupilName}</span>
          <span>{record.attainmentBand} · {record.term}</span>
        </Link>
      ))}
    </div>
  )
}

function SummaryGroups({ groups }: { groups: ReturnType<typeof groupByDemographic> }) {
  if (Object.keys(groups).length === 0) return <p style={mutedStyle}>No sex/gender column is available for this upload.</p>
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {Object.entries(groups).map(([name, summary]) => (
        <div key={name} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span>{name}</span>
          <strong>{summary.exsPlusPct}% EXS+</strong>
        </div>
      ))}
    </div>
  )
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section style={panelStyle}><h2 style={{ fontSize: 20, fontWeight: 650, marginBottom: 14 }}>{title}</h2>{children}</section>
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <section style={panelStyle}><p className="field__label">{label}</p><div style={{ fontFamily: 'var(--f-display)', fontSize: 36 }}>{value}</div></section>
}

function compareTerms(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true })
}

const panelStyle: CSSProperties = { border: '1px solid var(--line)', background: 'var(--paper)', borderRadius: 8, padding: 18 }
const mutedStyle: CSSProperties = { color: 'var(--ink-2)', fontSize: 13, lineHeight: 1.5 }
const tableStyle: CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 13 }
const thStyle: CSSProperties = { padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--line)', color: 'var(--ink-2)' }
const tdStyle: CSSProperties = { padding: '10px 12px', borderBottom: '1px solid var(--line)' }
