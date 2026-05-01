'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import type { Route } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArborSidebar } from '@/components/arbor/ArborSidebar'
import {
  calculatePupilMovement,
  countUniquePupils,
  filterRecords,
  getAvailableDimensions,
  getDashboardSections,
  getInterventionCandidates,
  groupByClass,
  groupByDemographic,
  groupBySubject,
  groupByTerm,
  groupByYearGroup,
  summariseAttainment,
  uniqueValues,
  type AttainmentRecord,
  type AttainmentSummary,
  type Band,
  type PupilMovement,
} from '@/lib/analytics/attainment'
import { answerAttainmentQuestion } from '@/lib/analytics/chat'
import { generateInsights } from '@/lib/analytics/insights'
import { buildReportSummary } from '@/lib/analytics/report'
import { clearAttainmentUploads, getAttainmentUploads, type AttainmentUpload } from '@/lib/attainmentStore'

type Filters = Partial<Record<'term' | 'subject' | 'yearGroup' | 'className' | 'sex' | 'fsm' | 'send' | 'eal' | 'pupilPremium', string>>

const bandColors: Record<Exclude<Band, 'UNKNOWN'>, string> = {
  PRE: '#ef4444',
  WTS: '#f59e0b',
  EXS: '#22c55e',
  GDS: '#2563eb',
}

const bandLabels: Record<Band, string> = {
  PRE: 'Pre',
  WTS: 'Working towards',
  EXS: 'Expected',
  GDS: 'Greater depth',
  UNKNOWN: 'Unknown',
}

const REPORT_ROUTE = '/arbor/reports' as Route

export function AttainmentDashboardClient({ reportMode = false }: { reportMode?: boolean }) {
  const router = useRouter()
  const [uploads, setUploads] = useState<AttainmentUpload[]>([])
  const [selectedUploadId, setSelectedUploadId] = useState<string>('')
  const [filters, setFilters] = useState<Filters>({})

  useEffect(() => {
    let active = true
    getAttainmentUploads().then((stored) => {
      if (!active) return
      setUploads(stored)
      setSelectedUploadId(stored[0]?.id ?? '')
    }).catch(() => {
      if (!active) return
      setUploads([])
      setSelectedUploadId('')
    })
    return () => { active = false }
  }, [])

  const selectedUpload = uploads.find((upload) => upload.id === selectedUploadId) ?? uploads[0] ?? null
  const allRecords = selectedUpload?.records ?? []
  const filteredRecords = useMemo(() => filterRecords(allRecords, filters), [allRecords, filters])
  const dimensions = useMemo(() => getAvailableDimensions(allRecords), [allRecords])
  const sections = useMemo(() => getDashboardSections(filteredRecords), [filteredRecords])
  const summary = useMemo(() => summariseAttainment(filteredRecords), [filteredRecords])
  const pupilCount = useMemo(() => countUniquePupils(filteredRecords), [filteredRecords])
  const subjects = useMemo(() => groupBySubject(filteredRecords), [filteredRecords])
  const terms = useMemo(() => uniqueValues(allRecords, 'term'), [allRecords])
  const sortedTerms = useMemo(() => [...terms].sort(compareTerms), [terms])
  const movement = useMemo(() => {
    if (sortedTerms.length < 2) return []
    return calculatePupilMovement(filteredRecords, sortedTerms[sortedTerms.length - 2], sortedTerms[sortedTerms.length - 1])
  }, [filteredRecords, sortedTerms])
  const interventions = useMemo(() => getInterventionCandidates(filteredRecords, movement), [filteredRecords, movement])
  const insights = useMemo(() => generateInsights(filteredRecords), [filteredRecords])
  const reportSummary = useMemo(() => buildReportSummary(filteredRecords), [filteredRecords])

  function updateFilter(key: keyof Filters, value: string) {
    setFilters((current) => ({ ...current, [key]: value || undefined }))
  }

  function resetFilters() {
    setFilters({})
  }

  async function clearData() {
    await clearAttainmentUploads()
    setUploads([])
    setSelectedUploadId('')
    setFilters({})
  }

  if (uploads.length === 0) {
    return (
      <div className="app">
        <ArborSidebar role="slt" open={true} editMode={false} />
        <main className="app__main" style={{ background: 'var(--paper)', display: 'grid', placeItems: 'center', padding: 24 }}>
          <section style={{ maxWidth: 560, textAlign: 'center' }}>
            <p className="eyebrow">Arbor AI</p>
            <h1 className="h1" style={{ marginTop: 8 }}>Start with an upload</h1>
            <p style={{ color: 'var(--ink-2)', lineHeight: 1.6, marginTop: 12 }}>
              Upload a CSV or Excel markbook and the dashboard will build itself from the subjects, classes, groups and terms it finds.
            </p>
            <button className="btn btn--primary" style={{ marginTop: 22 }} onClick={() => router.push('/arbor/upload')}>
              Upload attainment data
            </button>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <ArborSidebar role="slt" open={true} editMode={false} />
      <main className="app__main attainment-print-root" style={{ overflowY: 'auto', background: 'var(--paper-2)' }}>
        <div style={{ width: '100%', maxWidth: 1360, margin: '0 auto', padding: '26px 24px 56px' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start', marginBottom: 18 }}>
            <div>
              <p className="eyebrow">{reportMode ? 'SLT report' : 'Dynamic dashboard'}</p>
              <h1 className="h1" style={{ marginTop: 8 }}>{dashboardTitle(selectedUpload)}</h1>
              <p style={{ color: 'var(--ink-2)', marginTop: 8 }}>
                {selectedUpload.detectedSummary.subjects.length} subjects, {selectedUpload.detectedSummary.terms.length} terms, {selectedUpload.detectedSummary.pupils} pupils.
              </p>
            </div>
            <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn--ghost" onClick={() => router.push('/arbor/upload')}>Upload</button>
              <button className="btn btn--ghost" onClick={() => router.push(REPORT_ROUTE)}>Report</button>
              <button className="btn btn--primary" onClick={() => window.print()}>Print</button>
            </div>
          </header>

          <section className="no-print" style={{ ...panelStyle, marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1.2fr) repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
              <label className="field">
                <span className="field__label">Upload</span>
                <select
                  className="select"
                  value={selectedUpload.id}
                  onChange={(event) => { setSelectedUploadId(event.target.value); setFilters({}) }}
                >
                  {uploads.map((upload) => (
                    <option key={upload.id} value={upload.id}>{upload.fileName}</option>
                  ))}
                </select>
              </label>
              <FilterSelect label="Term" value={filters.term} options={uniqueValues(allRecords, 'term')} onChange={(value) => updateFilter('term', value)} />
              <FilterSelect label="Subject" value={filters.subject} options={uniqueValues(allRecords, 'subject')} onChange={(value) => updateFilter('subject', value)} />
              {dimensions.yearGroupCount > 0 && <FilterSelect label="Year group" value={filters.yearGroup} options={uniqueValues(allRecords, 'yearGroup')} onChange={(value) => updateFilter('yearGroup', value)} />}
              {dimensions.classCount > 0 && <FilterSelect label="Class" value={filters.className} options={uniqueValues(allRecords, 'className')} onChange={(value) => updateFilter('className', value)} />}
              {dimensions.hasSex && <FilterSelect label="Sex" value={filters.sex} options={uniqueValues(allRecords, 'sex')} onChange={(value) => updateFilter('sex', value)} />}
              {dimensions.hasFSM && <FilterSelect label="FSM" value={filters.fsm} options={['true', 'false']} labelFor={yesNoLabel} onChange={(value) => updateFilter('fsm', value)} />}
              {dimensions.hasSEND && <FilterSelect label="SEND" value={filters.send} options={['true', 'false']} labelFor={yesNoLabel} onChange={(value) => updateFilter('send', value)} />}
              {dimensions.hasEAL && <FilterSelect label="EAL" value={filters.eal} options={['true', 'false']} labelFor={yesNoLabel} onChange={(value) => updateFilter('eal', value)} />}
              {dimensions.hasPupilPremium && <FilterSelect label="Pupil premium" value={filters.pupilPremium} options={['true', 'false']} labelFor={yesNoLabel} onChange={(value) => updateFilter('pupilPremium', value)} />}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 14 }}>
              <button className="btn btn--ghost btn--sm" onClick={resetFilters}>Reset filters</button>
              <button className="btn btn--ghost btn--sm" onClick={clearData}>Delete session data</button>
            </div>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 16 }}>
            <KpiCard label="Pupils" value={pupilCount} helper={`${summary.total} attainment records in view`} />
            <KpiCard label="Expected or above" value={`${summary.exsPlusPct}%`} helper={`${summary.exsPlus} results`} accent="#22c55e" />
            <KpiCard label="Greater depth" value={`${summary.gdsPct}%`} helper={`${summary.gds} results`} accent="#2563eb" />
            <KpiCard label="Below expected" value={`${summary.belowExpectedPct}%`} helper={`${summary.belowExpected} results`} accent={summary.belowExpectedPct >= 30 ? '#ef4444' : '#f59e0b'} />
          </section>

          {reportMode && <ReportOverview summary={reportSummary} upload={selectedUpload} filters={filters} />}

          <section className="attainment-dashboard-grid" style={{ display: 'grid', gridTemplateColumns: reportMode ? '1fr' : 'minmax(0, 1.5fr) minmax(280px, 0.85fr)', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <SubjectCards subjects={subjects} records={filteredRecords} uploadId={selectedUpload.id} />
              {sections.includes('attainmentStackedBars') && <StackedBars title="Attainment by subject" groups={subjects} />}
              {sections.includes('boysGirlsComparison') && <DemographicComparison title="Boys and girls" groups={groupByDemographic(filteredRecords, 'sex')} />}
              {sections.includes('groupComparison') && <GroupComparison records={filteredRecords} dimensions={dimensions} />}
              {sections.includes('yearGroupHeatmap') && <Heatmap records={filteredRecords} />}
              {sections.includes('classComparison') && <StackedBars title="Class comparison" groups={groupByClass(filteredRecords)} />}
              {sections.includes('trendChart') && <TrendTable records={filteredRecords} />}
              {sections.includes('pupilMovement') && <MovementPanel movement={movement} />}
              <PupilTable records={filteredRecords} uploadId={selectedUpload.id} />
            </div>

            {!reportMode && (
              <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <DataChatPanel records={filteredRecords} />
                <InsightPanel insights={insights} />
                <InterventionPanel candidates={interventions} />
                <section style={panelStyle}>
                  <p className="eyebrow">Detected fields</p>
                  <DetectedPills upload={selectedUpload} />
                </section>
              </aside>
            )}

            {reportMode && (
              <InterventionPanel candidates={interventions} />
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
  labelFor = (item) => item,
}: {
  label: string
  value?: string
  options: string[]
  onChange: (value: string) => void
  labelFor?: (value: string) => string
}) {
  if (options.length === 0) return null
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <select className="select" value={value ?? ''} onChange={(event) => onChange(event.target.value)}>
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>{labelFor(option)}</option>
        ))}
      </select>
    </label>
  )
}

function ReportOverview({
  summary,
  upload,
  filters,
}: {
  summary: ReturnType<typeof buildReportSummary>
  upload: AttainmentUpload
  filters: Filters
}) {
  const activeFilters = Object.entries(filters).filter((entry): entry is [keyof Filters, string] => Boolean(entry[1]))

  return (
    <section className="report-section" style={{ ...panelStyle, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 650 }}>SLT summary</h2>
          <p style={{ color: 'var(--ink-2)', fontSize: 13, marginTop: 4 }}>
            {scopeLabel(upload)} · Upload: {upload.fileName}
          </p>
        </div>
        <span className="tag">{summary.subjectCount} subjects · {summary.termCount} terms</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <ReportFact label="Pupils" value={summary.pupilCount} helper={`${summary.recordCount} records`} />
        <ReportFact label="Expected or above" value={`${summary.overall.exsPlusPct}%`} helper={`${summary.overall.exsPlus} results`} />
        <ReportFact label="Greater depth" value={`${summary.overall.gdsPct}%`} helper={`${summary.overall.gds} results`} />
        <ReportFact label="Below expected" value={`${summary.overall.belowExpectedPct}%`} helper={`${summary.overall.belowExpected} results`} />
        <ReportFact label="Strongest subject" value={summary.strongestSubject?.name ?? '-'} helper={summary.strongestSubject ? `${summary.strongestSubject.summary.exsPlusPct}% EXS+` : 'No data'} />
        <ReportFact label="Needs closest look" value={summary.weakestSubject?.name ?? '-'} helper={summary.weakestSubject ? `${summary.weakestSubject.summary.belowExpectedPct}% below expected` : 'No data'} />
        <ReportFact label="Support list" value={summary.interventionCount} helper="pupils flagged" />
      </div>

      <div style={{ borderTop: '1px solid var(--line)', paddingTop: 14, marginTop: 16 }}>
        <p className="field__label">Report context</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          <span className="tag">{summary.termCount} terms</span>
          <span className="tag">{summary.subjectCount} subjects</span>
          <span className="tag">{upload.detectedSummary.pupils} pupils in upload</span>
          {activeFilters.length === 0 ? (
            <span className="tag">No filters applied</span>
          ) : activeFilters.map(([key, value]) => (
            <span key={key} className="tag">{filterLabel(key)}: {filterValueLabel(value)}</span>
          ))}
        </div>
      </div>

      <ReportSubjectTable rows={summary.subjectRows} />
      <ReportMovementSummaryPanel movement={summary.movementSummary} />

      {summary.insights.length > 0 && (
        <div className="report-section" style={{ borderTop: '1px solid var(--line)', paddingTop: 14, marginTop: 16, display: 'grid', gap: 8 }}>
          <h3 style={{ fontSize: 18, fontWeight: 650 }}>Auto commentary</h3>
          {summary.insights.slice(0, 4).map((insight) => (
            <p key={insight.text} style={{ color: 'var(--ink-2)', fontSize: 13, margin: 0, lineHeight: 1.45 }}>{insight.text}</p>
          ))}
        </div>
      )}
    </section>
  )
}

function ReportSubjectTable({ rows }: { rows: ReturnType<typeof buildReportSummary>['subjectRows'] }) {
  if (rows.length === 0) return null

  return (
    <div className="report-section" style={{ borderTop: '1px solid var(--line)', paddingTop: 14, marginTop: 16 }}>
      <h3 style={{ fontSize: 18, fontWeight: 650 }}>Subject table</h3>
      <div style={{ overflowX: 'auto', marginTop: 10 }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Subject</th>
              <th style={thStyle}>Pupils</th>
              <th style={thStyle}>Records</th>
              <th style={thStyle}>PRE</th>
              <th style={thStyle}>WTS</th>
              <th style={thStyle}>EXS+</th>
              <th style={thStyle}>GDS</th>
              <th style={thStyle}>Below expected</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.subject}>
                <td style={tdStyle}>{row.subject}</td>
                <td style={tdStyle}>{row.pupilCount}</td>
                <td style={tdStyle}>{row.recordCount}</td>
                <td style={tdStyle}>{row.prePct}%</td>
                <td style={tdStyle}>{row.wtsPct}%</td>
                <td style={tdStyle}><strong>{row.exsPlusPct}%</strong></td>
                <td style={tdStyle}>{row.gdsPct}%</td>
                <td style={tdStyle}>{row.belowExpectedPct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ReportMovementSummaryPanel({ movement }: { movement: ReturnType<typeof buildReportSummary>['movementSummary'] }) {
  if (!movement) {
    return (
      <div className="report-section" style={{ borderTop: '1px solid var(--line)', paddingTop: 14, marginTop: 16 }}>
        <h3 style={{ fontSize: 18, fontWeight: 650 }}>Movement summary</h3>
        <p style={emptyTextStyle}>Movement is not available because the report needs at least two comparable terms.</p>
      </div>
    )
  }

  return (
    <div className="report-section" style={{ borderTop: '1px solid var(--line)', paddingTop: 14, marginTop: 16 }}>
      <h3 style={{ fontSize: 18, fontWeight: 650 }}>Movement summary</h3>
      <p style={{ color: 'var(--ink-2)', fontSize: 13, marginTop: 4 }}>
        Latest movement from {movement.fromTerm} to {movement.toTerm}.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginTop: 12 }}>
        <ReportFact label="Moved up" value={movement.movedUp} helper={`${movement.total} comparable records`} />
        <ReportFact label="Stayed same" value={movement.stayedSame} helper="stable records" />
        <ReportFact label="Slipped back" value={movement.slippedBack} helper="review first" />
      </div>
      {movement.slippedExamples.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <p className="field__label">Examples to review</p>
          <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
            {movement.slippedExamples.map((item) => (
              <p key={`${item.pupilName}-${item.subject}`} style={{ color: 'var(--ink-2)', fontSize: 13, margin: 0 }}>
                {item.pupilName} in {item.subject}: {item.fromBand} to {item.toBand}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ReportFact({ label, value, helper }: { label: string; value: string | number; helper: string }) {
  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 14, background: 'var(--paper-2)' }}>
      <p className="field__label">{label}</p>
      <div style={{ fontFamily: 'var(--f-display)', fontSize: typeof value === 'number' ? 34 : 24, marginTop: 4 }}>{value}</div>
      <p style={{ color: 'var(--ink-3)', fontSize: 12, marginTop: 4 }}>{helper}</p>
    </div>
  )
}

function KpiCard({ label, value, helper, accent = 'var(--ink)' }: { label: string; value: string | number; helper: string; accent?: string }) {
  return (
    <section style={{ ...panelStyle, minHeight: 118 }}>
      <p className="field__label">{label}</p>
      <div style={{ fontFamily: 'var(--f-display)', fontSize: 42, color: accent, lineHeight: 1.05, marginTop: 6 }}>{value}</div>
      <p style={{ color: 'var(--ink-3)', fontSize: 12, marginTop: 8 }}>{helper}</p>
    </section>
  )
}

function SubjectCards({ subjects, records, uploadId }: { subjects: Record<string, AttainmentSummary>; records: AttainmentRecord[]; uploadId: string }) {
  return (
    <section>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
        {Object.entries(subjects).map(([subject, summary]) => (
          <Link key={subject} href={`/arbor/subjects/${encodeURIComponent(subject)}?uploadId=${encodeURIComponent(uploadId)}` as Route} style={{ ...panelStyle, display: 'block' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>{subject}</h2>
              <span className="tag">{countUniquePupils(records.filter((record) => record.subject === subject))} pupils</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
              <MiniMetric label="PRE" value={`${summary.prePct}%`} color={bandColors.PRE} />
              <MiniMetric label="WTS" value={`${summary.wtsPct}%`} color={bandColors.WTS} />
              <MiniMetric label="EXS+" value={`${summary.exsPlusPct}%`} color={bandColors.EXS} />
              <MiniMetric label="GDS" value={`${summary.gdsPct}%`} color={bandColors.GDS} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

function MiniMetric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div style={{ color, fontWeight: 700, fontSize: 18 }}>{value}</div>
      <div style={{ color: 'var(--ink-3)', fontSize: 11 }}>{label}</div>
    </div>
  )
}

function StackedBars({ title, groups }: { title: string; groups: Record<string, AttainmentSummary> }) {
  return (
    <section style={panelStyle}>
      <SectionHeader title={title} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginTop: 16 }}>
        {Object.entries(groups).map(([name, summary]) => (
          <div key={name} style={{ display: 'grid', gridTemplateColumns: '150px minmax(0, 1fr) 68px', gap: 12, alignItems: 'center' }}>
            <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
            <BandBar summary={summary} />
            <div style={{ color: 'var(--ink-2)', fontSize: 12, textAlign: 'right' }}>{summary.exsPlusPct}% EXS+</div>
          </div>
        ))}
      </div>
    </section>
  )
}

function BandBar({ summary }: { summary: AttainmentSummary }) {
  return (
    <div style={{ display: 'flex', height: 30, borderRadius: 6, overflow: 'hidden', background: 'var(--paper-3)' }}>
      {(['PRE', 'WTS', 'EXS', 'GDS'] as const).map((band) => {
        const percentage = summary[`${band.toLowerCase()}Pct` as 'prePct' | 'wtsPct' | 'exsPct' | 'gdsPct']
        return (
          <div
            key={band}
            style={{ width: `${percentage}%`, background: bandColors[band], minWidth: percentage > 0 ? 3 : 0, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700 }}
            title={`${bandLabels[band]} ${percentage}%`}
          >
            {percentage >= 12 ? `${percentage}%` : ''}
          </div>
        )
      })}
    </div>
  )
}

function DemographicComparison({ title, groups }: { title: string; groups: Record<string, AttainmentSummary> }) {
  return (
    <section style={panelStyle}>
      <SectionHeader title={title} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginTop: 14 }}>
        {Object.entries(groups).map(([name, summary]) => (
          <div key={name} style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 14 }}>
            <p style={{ fontWeight: 600 }}>{name}</p>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 34, color: 'var(--chalk-green)', marginTop: 4 }}>{summary.exsPlusPct}%</div>
            <p style={{ color: 'var(--ink-3)', fontSize: 12 }}>expected or above from {summary.total} results</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function GroupComparison({ records, dimensions }: { records: AttainmentRecord[]; dimensions: ReturnType<typeof getAvailableDimensions> }) {
  const groups = [
    dimensions.hasFSM ? ['FSM', groupByDemographic(records, 'fsm')] as const : null,
    dimensions.hasSEND ? ['SEND', groupByDemographic(records, 'send')] as const : null,
    dimensions.hasEAL ? ['EAL', groupByDemographic(records, 'eal')] as const : null,
    dimensions.hasPupilPremium ? ['Pupil premium', groupByDemographic(records, 'pupilPremium')] as const : null,
  ].filter(Boolean) as [string, Record<string, AttainmentSummary>][]

  if (groups.length === 0) return null

  return (
    <section style={panelStyle}>
      <SectionHeader title="Pupil group comparison" />
      <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
        {groups.map(([label, values]) => (
          <div key={label}>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>{label}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
              {Object.entries(values).map(([name, summary]) => (
                <div key={name} style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 12 }}>
                  <span style={{ color: 'var(--ink-2)', fontSize: 12 }}>{name}</span>
                  <strong style={{ display: 'block', fontSize: 24, marginTop: 2 }}>{summary.exsPlusPct}%</strong>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function Heatmap({ records }: { records: AttainmentRecord[] }) {
  const years = Object.keys(groupByYearGroup(records))
  const subjects = uniqueValues(records, 'subject')

  return (
    <section style={panelStyle}>
      <SectionHeader title="Year group heatmap" />
      <div style={{ overflowX: 'auto', marginTop: 14 }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Year group</th>
              {subjects.map((subject) => <th key={subject} style={thStyle}>{subject}</th>)}
            </tr>
          </thead>
          <tbody>
            {years.map((year) => (
              <tr key={year}>
                <td style={tdStyle}>{year}</td>
                {subjects.map((subject) => {
                  const summary = summariseAttainment(records.filter((record) => record.yearGroup === year && record.subject === subject))
                  return <td key={subject} style={{ ...tdStyle, background: heatColor(summary.exsPlusPct), fontWeight: 700 }}>{summary.total ? `${summary.exsPlusPct}%` : '-'}</td>
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function TrendTable({ records }: { records: AttainmentRecord[] }) {
  const terms = uniqueValues(records, 'term').sort(compareTerms)
  const subjectSummaries = groupBySubject(records)

  return (
    <section style={panelStyle}>
      <SectionHeader title="Trend by term" />
      <div style={{ overflowX: 'auto', marginTop: 14 }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Subject</th>
              {terms.map((term) => <th key={term} style={thStyle}>{term}</th>)}
            </tr>
          </thead>
          <tbody>
            {Object.keys(subjectSummaries).map((subject) => (
              <tr key={subject}>
                <td style={tdStyle}>{subject}</td>
                {terms.map((term) => {
                  const summary = summariseAttainment(records.filter((record) => record.subject === subject && record.term === term))
                  return <td key={term} style={tdStyle}>{summary.total ? `${summary.exsPlusPct}% expected or above` : '-'}</td>
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function MovementPanel({ movement }: { movement: PupilMovement[] }) {
  const movedUp = movement.filter((item) => item.movement === 'up')
  const stayed = movement.filter((item) => item.movement === 'same')
  const slipped = movement.filter((item) => item.movement === 'down')

  return (
    <section style={panelStyle}>
      <SectionHeader title="Pupil movement" />
      {movement.length === 0 ? (
        <p style={emptyTextStyle}>Pupil movement is not available because the current filters do not contain matching pupils across two terms.</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 14 }}>
            <KpiCard label="Moved up" value={movedUp.length} helper="results improved" accent="#22c55e" />
            <KpiCard label="Stayed same" value={stayed.length} helper="stable results" accent="#2563eb" />
            <KpiCard label="Slipped back" value={slipped.length} helper="needs review" accent="#ef4444" />
          </div>
          <MovementList title="Slipped back" movement={slipped} />
          <MovementList title="Moved up" movement={movedUp} />
        </>
      )}
    </section>
  )
}

function MovementList({ title, movement }: { title: string; movement: PupilMovement[] }) {
  if (movement.length === 0) return null
  return (
    <div style={{ marginTop: 16 }}>
      <p style={{ fontWeight: 600 }}>{title}</p>
      <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
        {movement.slice(0, 8).map((item) => (
          <div key={`${item.pupilName}-${item.subject}-${item.fromTerm}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13, borderBottom: '1px solid var(--line)', paddingBottom: 6 }}>
            <span>{item.pupilName} in {item.subject}</span>
            <span>{item.fromBand} to {item.toBand}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PupilTable({ records, uploadId }: { records: AttainmentRecord[]; uploadId: string }) {
  const rows = Object.values(records.reduce<Record<string, { pupilId: string; pupilName: string; yearGroup?: string; className?: string; bands: Record<string, Band> }>>((acc, record) => {
    const key = record.pupilId || record.pupilName
    acc[key] ??= { pupilId: key, pupilName: record.pupilName, yearGroup: record.yearGroup, className: record.className, bands: {} }
    acc[key].bands[record.subject] = record.attainmentBand
    return acc
  }, {})).sort((a, b) => a.pupilName.localeCompare(b.pupilName))
  const subjects = uniqueValues(records, 'subject')

  return (
    <section style={panelStyle}>
      <SectionHeader title="Pupil table" />
      <div style={{ overflowX: 'auto', marginTop: 14 }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Pupil</th>
              <th style={thStyle}>Year</th>
              <th style={thStyle}>Class</th>
              {subjects.map((subject) => <th key={subject} style={thStyle}>{subject}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.pupilName}>
                <td style={tdStyle}>
                  <Link href={`/arbor/pupil/${encodeURIComponent(row.pupilId)}?uploadId=${encodeURIComponent(uploadId)}` as Route} style={{ fontWeight: 600, textDecoration: 'underline' }}>
                    {row.pupilName}
                  </Link>
                </td>
                <td style={tdStyle}>{row.yearGroup ?? '-'}</td>
                <td style={tdStyle}>{row.className ?? '-'}</td>
                {subjects.map((subject) => <td key={subject} style={tdStyle}><BandPill band={row.bands[subject]} /></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function InterventionPanel({ candidates }: { candidates: ReturnType<typeof getInterventionCandidates> }) {
  return (
    <section style={panelStyle}>
      <SectionHeader title="Pupils needing support" />
      {candidates.length === 0 ? (
        <p style={emptyTextStyle}>No pupils are below expected in the current filters.</p>
      ) : (
        <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
          {candidates.slice(0, 12).map((candidate) => (
            <article key={candidate.pupilName} style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <strong>{candidate.pupilName}</strong>
                <span className={`tag ${candidate.priority === 'High' ? 'tag--red' : candidate.priority === 'Medium' ? 'tag--amber' : 'tag--blue'}`}>{candidate.priority}</span>
              </div>
              <p style={{ color: 'var(--ink-2)', fontSize: 13, marginTop: 6 }}>{candidate.reason}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function InsightPanel({ insights }: { insights: ReturnType<typeof generateInsights> }) {
  return (
    <section style={panelStyle}>
      <SectionHeader title="Auto commentary" />
      <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
        {insights.map((insight) => (
          <div key={insight.text} style={{ borderLeft: `4px solid ${insightColor(insight.type)}`, background: 'var(--paper-2)', padding: '10px 12px', borderRadius: 6 }}>
            <p style={{ color: 'var(--ink-2)', fontSize: 13, lineHeight: 1.45 }}>{insight.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function DataChatPanel({ records }: { records: AttainmentRecord[] }) {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: 'Ask me about this dashboard, for example: Which subject is strongest? Who needs support? How many pupils are in view?',
    },
  ])

  function askQuestion() {
    const trimmed = question.trim()
    if (!trimmed) return

    setMessages((current) => [
      ...current,
      { role: 'user', text: trimmed },
      { role: 'assistant', text: answerAttainmentQuestion(trimmed, records) },
    ])
    setQuestion('')
  }

  function askSuggestedPrompt(prompt: string) {
    setMessages((current) => [
      ...current,
      { role: 'user', text: prompt },
      { role: 'assistant', text: answerAttainmentQuestion(prompt, records) },
    ])
  }

  return (
    <section style={panelStyle}>
      <SectionHeader title="Ask about this data" />
      <div style={{ display: 'grid', gap: 10, marginTop: 14, maxHeight: 280, overflowY: 'auto' }}>
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            style={{
              justifySelf: message.role === 'user' ? 'end' : 'start',
              maxWidth: '92%',
              border: '1px solid var(--line)',
              borderRadius: 8,
              padding: '9px 11px',
              background: message.role === 'user' ? 'var(--ink)' : 'var(--paper-2)',
              color: message.role === 'user' ? 'var(--paper)' : 'var(--ink-2)',
              fontSize: 13,
              lineHeight: 1.45,
            }}
          >
            {message.text}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
        {['How many pupils are there?', 'Which subject is strongest?', 'Who needs support?'].map((prompt) => (
          <button key={prompt} className="tag" onClick={() => askSuggestedPrompt(prompt)}>{prompt}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input
          className="input"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') askQuestion()
          }}
          placeholder="Ask a question"
          aria-label="Ask a question about this data"
          style={{ minWidth: 0 }}
        />
        <button className="btn btn--primary" onClick={askQuestion}>Ask</button>
      </div>
      <p style={{ color: 'var(--ink-3)', fontSize: 11, lineHeight: 1.45, marginTop: 8 }}>
        Answers use the current filters and stay in this browser session.
      </p>
    </section>
  )
}

function DetectedPills({ upload }: { upload: AttainmentUpload }) {
  const summary = upload.detectedSummary
  return (
    <div style={{ display: 'grid', gap: 14, marginTop: 14 }}>
      <PillGroup label="Subjects" values={summary.subjects} />
      <PillGroup label="Terms" values={summary.terms} />
      <PillGroup label="Groups" values={summary.groups} empty="No pupil groups found" />
    </div>
  )
}

function PillGroup({ label, values, empty = 'None' }: { label: string; values: string[]; empty?: string }) {
  return (
    <div>
      <p className="field__label">{label}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 7 }}>
        {values.length > 0 ? values.map((value) => <span key={value} className="tag">{value}</span>) : <span style={emptyTextStyle}>{empty}</span>}
      </div>
    </div>
  )
}

function BandPill({ band }: { band?: Band }) {
  if (!band) return <span style={{ color: 'var(--ink-3)' }}>-</span>
  const className = band === 'PRE' ? 'tag tag--red' : band === 'WTS' ? 'tag tag--amber' : band === 'EXS' ? 'tag tag--green' : 'tag tag--blue'
  return <span className={className}>{band}</span>
}

function SectionHeader({ title }: { title: string }) {
  return <h2 style={{ fontSize: 20, lineHeight: 1.2, fontWeight: 650 }}>{title}</h2>
}

function dashboardTitle(upload: AttainmentUpload | null): string {
  if (!upload) return 'Attainment dashboard'
  const summary = upload.detectedSummary
  if (summary.yearGroups.length === 1 && summary.classes.length <= 1) return summary.yearGroups[0]
  if (summary.yearGroups.length > 1) return 'Whole school'
  return 'Attainment dashboard'
}

function scopeLabel(upload: AttainmentUpload): string {
  const summary = upload.detectedSummary
  if (summary.yearGroups.length > 1) return 'Whole-school report'
  if (summary.classes.length === 1) return `${summary.classes[0]} report`
  if (summary.yearGroups.length === 1) return `${summary.yearGroups[0]} report`
  return 'Attainment report'
}

function filterLabel(key: keyof Filters): string {
  const labels: Record<keyof Filters, string> = {
    term: 'Term',
    subject: 'Subject',
    yearGroup: 'Year group',
    className: 'Class',
    sex: 'Sex',
    fsm: 'FSM',
    send: 'SEND',
    eal: 'EAL',
    pupilPremium: 'Pupil premium',
  }
  return labels[key]
}

function filterValueLabel(value: string): string {
  return value === 'true' || value === 'false' ? yesNoLabel(value) : value
}

function yesNoLabel(value: string): string {
  return value === 'true' ? 'Yes' : 'No'
}

function compareTerms(a: string, b: string): number {
  return termValue(a) - termValue(b) || a.localeCompare(b)
}

function termValue(term: string): number {
  const lower = term.toLowerCase()
  const year = Number(lower.match(/\b20\d{2}\b/)?.[0] ?? 0)
  const season = lower.includes('autumn') ? 1 : lower.includes('spring') ? 2 : lower.includes('summer') ? 3 : 0
  return year * 10 + season
}

function heatColor(value: number): string {
  if (value >= 85) return '#dcfce7'
  if (value >= 65) return '#fef9c3'
  if (value > 0) return '#fee2e2'
  return 'transparent'
}

function insightColor(type: string): string {
  if (type === 'success') return '#22c55e'
  if (type === 'warning' || type === 'risk') return '#ef4444'
  if (type === 'gap') return '#f59e0b'
  return '#2563eb'
}

const panelStyle: CSSProperties = {
  border: '1px solid var(--line)',
  background: 'var(--paper)',
  borderRadius: 8,
  padding: 18,
}

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: 620,
  fontSize: 13,
}

const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  borderBottom: '1px solid var(--line)',
  color: 'var(--ink-2)',
  background: 'var(--paper-2)',
  fontWeight: 650,
}

const tdStyle: CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid var(--line)',
  color: 'var(--ink)',
}

const emptyTextStyle: CSSProperties = {
  color: 'var(--ink-3)',
  fontSize: 13,
  lineHeight: 1.5,
  marginTop: 12,
}
