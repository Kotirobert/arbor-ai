import { Card, CardHeader, CardTitle, CardSubtitle } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

interface SubjectAttainmentPanelProps {
  subjectAttainment: Record<string, { pre: number; wt: number; exp: number; gd: number }>
  total: number
}

const BAND_COLORS = {
  pre: { fill: '#FCEBEB', label: 'Pre-working towards' },
  wt:  { fill: '#FAEEDA', label: 'Working towards' },
  exp: { fill: '#EAF3DE', label: 'Expected' },
  gd:  { fill: '#E6F1FB', label: 'Greater depth' },
}

export function SubjectAttainmentPanel({ subjectAttainment, total }: SubjectAttainmentPanelProps) {
  const subjects = Object.keys(subjectAttainment)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subject attainment — school wide</CardTitle>
        <CardSubtitle>All {total} pupils · proportion by assessment band</CardSubtitle>
      </CardHeader>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4">
        {Object.entries(BAND_COLORS).map(([key, { fill, label }]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm border border-stone-200 flex-shrink-0" style={{ background: fill }} />
            <span className="text-xs text-stone-500">{label}</span>
          </div>
        ))}
      </div>

      {/* Stacked bars */}
      <div className="space-y-2">
        {subjects.map((subj) => {
          const c = subjectAttainment[subj]
          const preW  = Math.round(c.pre / total * 100)
          const wtW   = Math.round(c.wt  / total * 100)
          const expW  = Math.round(c.exp / total * 100)
          const gdW   = Math.round(c.gd  / total * 100)
          const belowPct = preW + wtW
          const belowColor = belowPct >= 40 ? 'text-red-600' : belowPct >= 30 ? 'text-amber-600' : 'text-stone-500'

          return (
            <div key={subj} className="flex items-center gap-3">
              <span className="text-xs text-stone-500 w-24 flex-shrink-0">{subj}</span>
              <div className="flex-1 flex h-2.5 rounded overflow-hidden">
                <div style={{ width: `${preW}%`, background: '#FCEBEB' }} />
                <div style={{ width: `${wtW}%`,  background: '#FAEEDA' }} />
                <div style={{ width: `${expW}%`, background: '#EAF3DE' }} />
                <div style={{ width: `${gdW}%`,  background: '#E6F1FB' }} />
              </div>
              <span className={cn('text-xs font-medium tabular-nums w-10 text-right flex-shrink-0', belowColor)}>
                {belowPct}%↓
              </span>
              <span className="text-xs text-stone-400 w-10 text-right flex-shrink-0">
                {gdW}% GD
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-stone-100 text-xs text-stone-400">
        ↓ % below expected standard · GD = greater depth
      </div>
    </Card>
  )
}
