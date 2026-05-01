import { Suspense } from 'react'

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--paper)]" />}>
      {children}
    </Suspense>
  )
}
