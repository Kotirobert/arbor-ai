'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  loadConfig,
  saveConfig,
  resetConfig,
  DEFAULT_CONFIG,
  type DashboardConfig,
  type PanelId,
} from '@/lib/dashboardConfig'
import type { UserRole } from '@/types'

interface UseDashboardConfigReturn {
  config:       DashboardConfig
  /** Draft config while the sidebar is open — not yet saved */
  draft:        DashboardConfig
  isDirty:      boolean
  editMode:     boolean
  openEdit:     () => void
  closeEdit:    () => void
  togglePanel:  (id: PanelId) => void
  save:         () => void
  reset:        () => void
  /** Whether a given panel should be rendered right now */
  isVisible:    (id: PanelId) => boolean
}

export function useDashboardConfig(role: UserRole): UseDashboardConfigReturn {
  const [config,   setConfig]   = useState<DashboardConfig>(DEFAULT_CONFIG)
  const [draft,    setDraft]    = useState<DashboardConfig>(DEFAULT_CONFIG)
  const [editMode, setEditMode] = useState(false)

  // Load from localStorage on mount and whenever role changes
  useEffect(() => {
    const loaded = loadConfig(role)
    setConfig(loaded)
    setDraft(loaded)
    setEditMode(false)
  }, [role])

  const openEdit = useCallback(() => {
    setDraft({ ...config })
    setEditMode(true)
  }, [config])

  const closeEdit = useCallback(() => {
    setDraft({ ...config })
    setEditMode(false)
  }, [config])

  const togglePanel = useCallback((id: PanelId) => {
    setDraft((prev: DashboardConfig) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const save = useCallback(() => {
    saveConfig(role, draft)
    setConfig({ ...draft })
    setEditMode(false)
  }, [role, draft])

  const reset = useCallback(() => {
    const fresh = resetConfig(role)
    setConfig(fresh)
    setDraft(fresh)
    setEditMode(false)
  }, [role])

  const isDirty = editMode && JSON.stringify(draft) !== JSON.stringify(config)

  const isVisible = useCallback(
    (id: PanelId) => config[id] ?? true,
    [config],
  )

  return { config, draft, isDirty, editMode, openEdit, closeEdit, togglePanel, save, reset, isVisible }
}
