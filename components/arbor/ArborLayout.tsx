'use client'

import { useCallback, useState } from 'react'
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
  const handleToggleEdit = useCallback(() => setEditMode((e) => !e), [])
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="app">
      <ArborSidebar
        role={role}
        editMode={editMode}
        onToggleEdit={handleToggleEdit}
        sidebarOpen={sidebarOpen}
        onCollapse={() => setSidebarOpen(false)}
      />
      <DashboardClient
        role={role}
        editMode={editMode}
        onToggleEdit={handleToggleEdit}
        {...rest}
      />
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="btn btn--ghost btn--sm"
          style={{
            position: 'fixed', top: 16, left: 16, zIndex: 50,
            background: 'var(--paper)', border: '1px solid var(--line)',
            padding: '6px 8px', borderRadius: 8,
          }}
          aria-label="Open sidebar"
        >
          <svg className="ico" viewBox="0 0 24 24" style={{ width: 15, height: 15 }}>
            <path d="M3 12h18M3 6h18M3 18h18"/>
          </svg>
        </button>
      )}
    </div>
  )
}
