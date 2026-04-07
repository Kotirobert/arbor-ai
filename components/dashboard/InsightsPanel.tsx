import { Card, CardHeader, CardTitle, CardSubtitle, CardDivider } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import type { InsightItem, YearGroupBar } from './DashboardClient'

interface InsightsPanelProps {
  title:          string
  subtitle:       string
  insights:       InsightItem[]
  yearGroupBars?: YearGroupBar[]
}

export function InsightsPanel({ title, subtitle, insights, yearGroupBars }: InsightsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardSubtitle>{subtitle}</CardSubtitle>
      </CardHeader>

      {yearGroupBars && yearGroupBars.length > 0 && (
        <>
          <div className="space-y-2.5 mb-4">
            {yearGroupBars.map((bar) => (
              <div key={bar.label} className="flex items-center gap-3">
                <span className="text-xs text-stone-400 w-14 flex-shrink-0">{bar.label}</span>
                <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full att-bar',
                      bar.pct < 80 ? 'bg-red-500' : bar.pct < 90 ? 'bg-amber-400' : 'bg-green-500',
                    )}
                    style={{ width: `${bar.pct}%` }}
                  />
                </div>
                <span className={cn(
                  'text-xs font-medium tabular-nums w-9 text-right',
                  bar.pct < 80 ? 'text-red-600' : bar.pct < 90 ? 'text-amber-600' : 'text-green-600',
                )}>
                  {bar.pct}%
                </span>
              </div>
            ))}
          </div>
          <CardDivider />
        </>
      )}

      <div className="divide-y divide-stone-100">
        {insights.map((item) => (
          <div key={item.label} className="py-3 first:pt-0 last:pb-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={item.tagColor}>{item.tag}</Badge>
            </div>
            <p className="text-sm text-stone-600 leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}
