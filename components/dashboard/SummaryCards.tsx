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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-2xl border border-stone-200 shadow-card p-5">
          <div className="flex items-center gap-1.5 mb-2">
            <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', card.dot)} />
            <span className="text-xs font-medium text-stone-500">{card.label}</span>
          </div>
          <div className="text-3xl font-semibold text-stone-900 tabular-nums">{card.value}</div>
          <div className="text-xs text-stone-400 mt-1">{card.sub}</div>
        </div>
      ))}
    </div>
  )
}
