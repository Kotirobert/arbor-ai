import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-stone-200 rounded-lg', className)} />
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-card space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3">
      <Skeleton className="w-8 h-8 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-2.5 w-48" />
      </div>
      <Skeleton className="h-5 w-12 rounded-full" />
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <main className="app__main" style={{ background: 'var(--paper)', overflowY: 'auto' }}>
      <div style={{ padding: '32px 32px 48px' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ width: 160, height: 12, background: 'var(--line-2)', borderRadius: 6, marginBottom: 14 }} />
          <div style={{ width: 320, height: 36, background: 'var(--line)', borderRadius: 6 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: 20, background: 'var(--paper-2)' }}>
              <div style={{ width: 60, height: 10, background: 'var(--line-2)', borderRadius: 4, marginBottom: 12 }} />
              <div style={{ width: 48, height: 28, background: 'var(--line)', borderRadius: 4, marginBottom: 8 }} />
              <div style={{ width: 80, height: 9, background: 'var(--line-2)', borderRadius: 4 }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {[5, 3].map((rows, i) => (
            <div key={i} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: 20, background: 'var(--paper-2)' }}>
              <div style={{ width: 120, height: 11, background: 'var(--line-2)', borderRadius: 4, marginBottom: 16 }} />
              {Array.from({ length: rows }).map((_, j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: j === 0 ? 'none' : '1px solid var(--line)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--line-2)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ width: 120, height: 10, background: 'var(--line-2)', borderRadius: 4, marginBottom: 6 }} />
                    <div style={{ width: 80, height: 8, background: 'var(--line)', borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
