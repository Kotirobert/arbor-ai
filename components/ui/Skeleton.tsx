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
    <div className="max-w-screen-xl mx-auto px-6 py-6 space-y-5">
      <Skeleton className="h-7 w-48" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-card">
          <Skeleton className="h-4 w-48 mb-4" />
          {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-card space-y-3">
          <Skeleton className="h-4 w-28 mb-4" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  )
}
