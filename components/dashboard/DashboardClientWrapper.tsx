'use client'

import { useCallback, useState } from 'react'
import { DashboardClient } from './DashboardClient'
import type { ComponentProps } from 'react'

type DashboardClientProps = Omit<ComponentProps<typeof DashboardClient>, 'editMode' | 'onToggleEdit'>

export function DashboardClientWrapper(props: DashboardClientProps) {
  const [editMode, setEditMode] = useState(false)
  const handleToggleEdit = useCallback(() => setEditMode((e) => !e), [])

  return (
    <DashboardClient
      {...props}
      editMode={editMode}
      onToggleEdit={handleToggleEdit}
    />
  )
}
