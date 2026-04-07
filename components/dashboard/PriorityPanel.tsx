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

      <div className="divide-y divide-stone-100">
        {shown.map((row) => {
          const { pupil, risk, attendance } = row
          const { bg, text } = pupil.avatarColor
          const primaryReason = risk.flags[0]?.description ?? `${attendance.overallPct}% attendance`

          return (
            <Link
              key={pupil.id}
              href={`/pupil/${pupil.id}`}
              className="flex items-center gap-3 py-2.5 -mx-5 px-5 hover:bg-stone-50 transition-colors group"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0"
                style={{ background: bg, color: text }}
              >
                {pupil.initials}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-stone-900 truncate">{pupil.fullName}</span>
                  <span className="text-xs text-stone-400 font-normal">{pupil.className}</span>
                </div>
                <p className="text-xs text-stone-500 truncate">{primaryReason}</p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant={risk.riskLevel === 'high' ? 'red' : 'amber'}>
                  {risk.riskLevel === 'high' ? 'High' : 'Medium'}
                </Badge>
                <span className="text-xs text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  View →
                </span>
              </div>
            </Link>
          )
        })}

        {rows.length > limit && (
          <div className="pt-3">
            <Link href="/dashboard" className="text-xs text-brand-500 font-medium hover:underline">
              View {rows.length - limit} more students →
            </Link>
          </div>
        )}
      </div>
    </Card>
  )
}
