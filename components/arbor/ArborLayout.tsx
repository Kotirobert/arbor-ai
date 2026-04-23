'use client'

import { useState } from 'react'
import { ArborSidebar } from './ArborSidebar'
import { DashboardClient } from '@/components/dashboard/DashboardClient'
import type { UserRole, DashboardStats } from '@/types'
import type { PriorityRow, InsightItem, YearGroupBar } from '@/components/dashboard/DashboardClient'

interface ArborLayoutProps {
  role:              UserRole
  yearGroup:         string
  stats:             DashboardStats
  priorityRows:      PriorityRow[]
  yearGroupBars:     YearGroupBar[]
  attInsights:       InsightItem[]
  behInsights:       InsightItem[]
  subjectAttainment: Record<string, { pre: number; wt: number; exp: number; gd: number }>
  aiChips:           string[]
  suggestedPrompts:  string[]
}

export function ArborLayout({ role, ...rest }: ArborLayoutProps) {
  const [editMode, setEditMode] = useState(false)

  return (
    <div className="app">
      <ArborSidebar
        role={role}
        editMode={editMode}
        onToggleEdit={() => setEditMode((e) => !e)}
      />
      <DashboardClient
        role={role}
        editMode={editMode}
        onToggleEdit={() => setEditMode((e) => !e)}
        {...rest}
      />
    </div>
  )
}
