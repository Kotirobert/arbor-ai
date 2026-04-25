import { cn } from '@/lib/utils'
import type { DashboardStats } from '@/types'

export function SummaryCards({ stats }: { stats: DashboardStats }) {
  const cards = [
    { label: 'Total pupils',         value: stats.totalPupils.toLocaleString(), sub: 'On roll',                     dot: 'bg-blue-400' },
    { label: 'Pastoral priority',    value: stats.pupilsNeedingAttention,       sub: 'High-risk flags',              dot: 'bg-red-400' },
    { label: 'Attendance concerns',  value: stats.attendanceConcerns,           sub: 'Below 90% threshold',          dot: 'bg-amber-400' },
    { label: 'Attainment concerns',  value: stats.behaviourConcerns,            sub: '5+ subjects below expected',   dot: 'bg-green-400' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', card.dot)} />
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-2)' }}>{card.label}</span>
          </div>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: 40, lineHeight: 1, letterSpacing: '-0.02em', fontWeight: 400, color: 'var(--ink)' }}>{card.value}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>{card.sub}</div>
        </div>
      ))}
    </div>
  )
}
