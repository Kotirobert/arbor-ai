'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardSubtitle, CardDivider } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import { getSchoolData } from '@/lib/schoolStore'
import type { Pupil, AttendanceSummary, BehaviourSummary, RiskProfile, AiSummary } from '@/types'

interface PupilDetailClientProps {
  pupil:      Pupil
  attendance: AttendanceSummary
  behaviour:  BehaviourSummary
  risk:       RiskProfile
}

export function PupilDetailClient({ pupil, attendance, behaviour, risk }: PupilDetailClientProps) {
  const { toast }    = useToast()
  const [summary,    setSummary]    = useState<AiSummary | null>(null)
  const [generating, setGenerating] = useState(false)

  const { bg, text: textColor } = pupil.avatarColor

  async function handleGenerateSummary() {
    setGenerating(true)
    try {
      // Pass uploaded school data to the API so it uses the live snapshot
      const stored = getSchoolData()
      const body: Record<string, unknown> = {}
      if (stored) {
        body.schoolData = {
          pupils:          stored.pupils,
          attendance:      stored.attendance,
          behaviour:       stored.behaviour,
          subjectProfiles: stored.subjectProfiles,
          riskProfiles:    stored.riskProfiles,
          stats:           stored.stats,
        }
      }

      const res  = await fetch(`/api/pupils/${pupil.id}/summary`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const data = await res.json() as { summary?: AiSummary; error?: string }

      if (!res.ok || !data.summary) {
        throw new Error(data.error ?? 'Failed to generate summary')
      }

      setSummary(data.summary)
      toast('AI summary generated', 'success')
    } catch (err) {
      console.error('[summary]', err)
      toast('Failed to generate summary — check your OpenAI key or try again', 'error')
    } finally {
      setGenerating(false)
    }
  }

  // ── Derived display values ────────────────────────────────────
  const attColor =
    attendance.overallPct < 80 ? 'text-red-600' :
    attendance.overallPct < 90 ? 'text-amber-600' : 'text-green-600'
  const attBgColor =
    attendance.overallPct < 80 ? 'bg-red-500' :
    attendance.overallPct < 90 ? 'bg-amber-400' : 'bg-green-500'

  const first   = attendance.weeklyTrend[0]?.pct ?? attendance.overallPct
  const last    = attendance.weeklyTrend[attendance.weeklyTrend.length - 1]?.pct ?? attendance.overallPct
  const drop    = Math.round((first - last) * 10) / 10
  const attSub     = drop > 2 ? `↓ ${drop}pp over 4 weeks` : 'Stable'
  const attSubClass = drop > 2 ? 'text-red-500' : 'text-stone-400'

  const behColor =
    behaviour.totalIncidents >= 8 ? 'text-red-600' :
    behaviour.totalIncidents >= 4 ? 'text-amber-600' : 'text-green-600'

  const topBehType = (Object.entries(behaviour.typeBreakdown) as [string, number][])
    .sort((a, b) => b[1] - a[1])
    .find(([, count]) => count > 0)
  const behSub = topBehType ? topBehType[0].replace(/_/g, ' ') : 'No incidents'

  const riskBadgeVariant =
    risk.riskLevel === 'high'   ? 'red' :
    risk.riskLevel === 'medium' ? 'amber' :
    risk.riskLevel === 'low'    ? 'blue' : 'gray'

  const maxBeh    = Math.max(...(Object.values(behaviour.typeBreakdown) as number[]), 1)
  const maxBehBar = Math.max(...behaviour.weeklyTrend.map((w) => w.count), 1)

  return (
    <main className="max-w-screen-md mx-auto px-6 py-6">

      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-700 transition-colors mb-5"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M19 12H5m7-7l-7 7 7 7"/>
        </svg>
        Back to dashboard
      </Link>

      {/* ── Header card ── */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-card p-6 mb-4 flex items-start gap-5">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold flex-shrink-0"
          style={{ background: bg, color: textColor }}
        >
          {pupil.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-xl font-semibold text-stone-900">{pupil.fullName}</h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap text-sm text-stone-500">
                <span>Class {pupil.className}</span>
                <span className="text-stone-300">·</span>
                <span>Year {pupil.yearGroup}</span>
                {pupil.dateOfBirth && (
                  <>
                    <span className="text-stone-300">·</span>
                    <span>
                      DOB {new Date(pupil.dateOfBirth).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </span>
                  </>
                )}
              </div>
            </div>
            <Badge variant={riskBadgeVariant}>
              {risk.riskLevel === 'none'
                ? 'No concerns'
                : `${risk.riskLevel.charAt(0).toUpperCase() + risk.riskLevel.slice(1)} priority`}
            </Badge>
          </div>

          {/* Flags */}
          <div className="flex flex-wrap gap-2 mt-3">
            {risk.flags.slice(0, 3).map((f) => (
              <span key={f.reason}>
                <Badge variant={f.severity === 'high' ? 'red' : f.severity === 'medium' ? 'amber' : 'gray'}>
                  {f.reason.replace(/_/g, ' ')}
                </Badge>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <StatCard
          value={`${attendance.overallPct}%`}
          label="Attendance"
          valueClass={attColor}
          sub={attSub}
          subClass={attSubClass}
        />
        <StatCard
          value={String(behaviour.totalIncidents)}
          label="Behaviour incidents"
          valueClass={behColor}
          sub={behSub}
          subClass="text-stone-400 capitalize"
        />
        <StatCard
          value={String(attendance.lateCount)}
          label="Late sessions"
          valueClass={attendance.lateCount >= 6 ? 'text-amber-600' : 'text-stone-900'}
          sub="This half-term"
          subClass="text-stone-400"
        />
      </div>

      {/* ── Attendance trend ── */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Attendance trend</CardTitle>
          <CardSubtitle>Weekly breakdown — last {attendance.weeklyTrend.length} weeks</CardSubtitle>
        </CardHeader>

        <div className="space-y-2.5 mb-4">
          {attendance.weeklyTrend.map((week) => {
            const wBg   = week.pct < 80 ? 'bg-red-500'   : week.pct < 90 ? 'bg-amber-400' : 'bg-green-500'
            const wText = week.pct < 80 ? 'text-red-600' : week.pct < 90 ? 'text-amber-600' : 'text-green-600'
            return (
              <div key={week.weekLabel} className="flex items-center gap-3">
                <span className="text-xs text-stone-400 w-10 flex-shrink-0">{week.weekLabel}</span>
                <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full att-bar', wBg)} style={{ width: `${week.pct}%` }} />
                </div>
                <span className={cn('text-xs font-medium tabular-nums w-9 text-right', wText)}>{week.pct}%</span>
                <span className="text-xs text-stone-400 w-16 text-right flex-shrink-0">{week.absences} absent</span>
              </div>
            )
          })}
        </div>

        <CardDivider />

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-stone-900 tabular-nums">{attendance.authorisedAbsences}</div>
            <div className="text-xs text-stone-400 mt-0.5">Authorised</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-red-600 tabular-nums">{attendance.unauthorisedAbsences}</div>
            <div className="text-xs text-stone-400 mt-0.5">Unauthorised</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-amber-600 tabular-nums">{attendance.lateCount}</div>
            <div className="text-xs text-stone-400 mt-0.5">Late sessions</div>
          </div>
        </div>
      </Card>

      {/* ── Behaviour breakdown ── */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Behaviour breakdown</CardTitle>
          <CardSubtitle>Incident types and weekly trend</CardSubtitle>
        </CardHeader>

        <div className="space-y-2 mb-4">
          {(Object.entries(behaviour.typeBreakdown) as [string, number][])
            .filter(([, count]) => count > 0)
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => (
              <div key={type} className="flex items-center gap-3">
                <span className="text-xs text-stone-500 w-28 flex-shrink-0 capitalize">{type.replace(/_/g, ' ')}</span>
                <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-stone-400 att-bar"
                    style={{ width: `${Math.round((count / maxBeh) * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-stone-600 tabular-nums w-4 text-right">{count}</span>
              </div>
            ))}
          {(Object.values(behaviour.typeBreakdown) as number[]).every((v) => v === 0) && (
            <p className="text-sm text-stone-400 py-2">No behaviour incidents recorded.</p>
          )}
        </div>

        <CardDivider />

        <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-3">Weekly trend</p>
        <div className="flex gap-2 items-end" style={{ height: 52 }}>
          {behaviour.weeklyTrend.map((week) => (
            <div key={week.weekLabel} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col justify-end" style={{ height: 40 }}>
                <div
                  className={cn(
                    'w-full rounded-sm transition-all',
                    week.count >= 3 ? 'bg-red-300' : week.count >= 1 ? 'bg-amber-300' : 'bg-stone-100',
                  )}
                  style={{ height: `${Math.max(Math.round((week.count / maxBehBar) * 100), 4)}%` }}
                />
              </div>
              <span className="text-[10px] text-stone-400">{week.weekLabel}</span>
            </div>
          ))}
        </div>

        {behaviour.afternoonIncidentPct > 0.5 && (
          <>
            <CardDivider />
            <p className="text-sm text-stone-600">
              <span className="font-medium">{Math.round(behaviour.afternoonIncidentPct * 100)}%</span>
              {' '}of incidents occur in afternoon sessions (periods 4–5).
            </p>
          </>
        )}
      </Card>

      {/* ── AI Summary ── */}
      {!summary && (
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={generating}
          onClick={handleGenerateSummary}
          className="mb-4"
        >
          {!generating && <SparkleIcon />}
          {generating ? 'Generating AI summary…' : 'Generate AI summary'}
        </Button>
      )}

      {summary && (
        <Card className="fade-in border-brand-300 mb-4">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle>AI pastoral summary</CardTitle>
                <CardSubtitle>
                  Generated {new Date(summary.generatedAt).toLocaleString('en-GB', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                  {summary.model && summary.model !== 'template-v2' && (
                    <span className="ml-1.5 text-brand-500">· {summary.model}</span>
                  )}
                </CardSubtitle>
              </div>
              <Badge variant={riskBadgeVariant}>
                {risk.riskLevel === 'none' ? 'No concerns' : `${risk.riskLevel} risk`}
              </Badge>
            </div>
          </CardHeader>

          <p className="text-sm text-stone-700 leading-relaxed mb-4">{summary.narrative}</p>

          <CardDivider />

          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">
            Recommended actions
          </p>
          <ul className="space-y-2.5 mb-4">
            {summary.recommendations.map((rec: string, i: number) => (
              <li key={i} className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0 mt-1.5" />
                <span className="text-sm text-stone-700">{rec}</span>
              </li>
            ))}
          </ul>

          <CardDivider />

          <Button variant="ghost" size="sm" onClick={handleGenerateSummary} loading={generating}>
            Regenerate
          </Button>
        </Card>
      )}
    </main>
  )
}

// ── Sub-components ────────────────────────────────────────────

function StatCard({ value, label, valueClass, sub, subClass }: {
  value:       string
  label:       string
  valueClass?: string
  sub?:        string
  subClass?:   string
}) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-card p-5 text-center">
      <div className={cn('text-3xl font-semibold tabular-nums', valueClass)}>{value}</div>
      <div className="text-xs font-medium text-stone-500 mt-1">{label}</div>
      {sub && <div className={cn('text-[11px] mt-1', subClass)}>{sub}</div>}
    </div>
  )
}

function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17 5.8 21.3l2.4-7.4L2 9.4h7.6z"/>
    </svg>
  )
}
