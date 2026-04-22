'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardTitle, CardSubtitle } from '@/components/ui/Card'
import type { PriorityRow } from './DashboardClient'

interface PriorityPanelProps {
  rows:   PriorityRow[]
  limit?: number
}

export function PriorityPanel({ rows, limit = 6 }: PriorityPanelProps) {
  const shown = rows.slice(0, limit)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Students needing attention today</CardTitle>
        <CardSubtitle>{rows.length} students flagged in your current view</CardSubtitle>
      </CardHeader>

      <div>
        {shown.map((row) => {
          const { pupil, risk, attendance } = row
          const { bg, text } = pupil.avatarColor
          const primaryReason = risk.flags[0]?.description ?? `${attendance.overallPct}% attendance`

          return (
            <Link
              key={pupil.id}
              href={`/arbor/pupil/${pupil.id}` as any}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 0', borderBottom: '1px solid var(--line)',
                textDecoration: 'none', transition: 'background 0.12s ease',
              }}
              className="group"
            >
              <div
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 600, flexShrink: 0, background: bg, color: text,
                }}
              >
                {pupil.initials}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pupil.fullName}</span>
                  <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{pupil.className}</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--ink-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{primaryReason}</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <Badge variant={risk.riskLevel === 'high' ? 'red' : 'amber'}>
                  {risk.riskLevel === 'high' ? 'High' : 'Medium'}
                </Badge>
              </div>
            </Link>
          )
        })}

        {rows.length > limit && (
          <div style={{ paddingTop: 12 }}>
            <Link href={'/arbor/dashboard' as any} style={{ fontSize: 13, color: 'var(--chalk-green)', fontWeight: 500 }}>
              View {rows.length - limit} more students →
            </Link>
          </div>
        )}
      </div>
    </Card>
  )
}
