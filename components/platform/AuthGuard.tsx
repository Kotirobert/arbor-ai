'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getSession } from '@/lib/auth/mockSession'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const s = getSession()
    if (!s) {
      router.replace('/sign-in' as any)
      return
    }
    setChecked(true)
  }, [router])

  if (!checked) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-sm text-[var(--ink3)]">Loading…</div>
      </div>
    )
  }

  return <>{children}</>
}
