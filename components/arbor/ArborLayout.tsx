'use client'

import { useState } from 'react'
import { ArborSidebar } from './ArborSidebar'
import { DashboardClient } from '@/components/dashboard/DashboardClient'
import type { UserRole, DashboardStats } from '@/types'
import type { PriorityRow, InsightItem, YearGroupBar } from '@/components/dashboard/DashboardClient'

interface ArborLayoutProps {
  role:              UserRole
  yearGroup:         string
  schoolName:        string
  lastUpload:        string
  stats:             DashboardStats
  priorityRows:      PriorityRow[]
  yearGroupBars:     YearGroupBar[]
  attInsights:       InsightItem[]
  behInsights:       InsightItem[]
  subjectAttainment: Record<string, { pre: number; wt: number; exp: number; gd: number }>
  aiChips:           string[]
  suggestedPrompts:  string[]
}

export function ArborLayout({ role, schoolName, lastUpload, ...rest }: ArborLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app">
      <ArborSidebar
        role={role}
        schoolName={schoolName}
        lastUpload={lastUpload}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <DashboardClient
        role={role}
        onOpenSidebar={() => setSidebarOpen(true)}
        {...rest}
      />
    </div>
  )
}
