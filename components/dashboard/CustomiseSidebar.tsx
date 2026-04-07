'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import {
  PANEL_META,
  SECTION_LABELS,
  DEFAULT_CONFIG,
  type DashboardConfig,
  type PanelId,
  type PanelMeta,
} from '@/lib/dashboardConfig'
import type { UserRole } from '@/types'

interface CustomiseSidebarProps {
  role:         UserRole
  draft:        DashboardConfig
  isDirty:      boolean
  onToggle:     (id: PanelId) => void
  onSave:       () => void
  onReset:      () => void
  onClose:      () => void
}

// ── Icons ────────────────────────────────────────────────────

const PANEL_ICONS: Record<PanelId, ReactNode> = {
  summaryCards: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  priorityPupils: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  ),
  aiActions: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>
    </svg>
  ),
  attendanceBars: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  attainmentInsights: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/>
    </svg>
  ),
  subjectAttainment: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <path d="M2 20h20M6 20V10M12 20V4M18 20v-8"/>
    </svg>
  ),
  auditLog: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
    </svg>
  ),
}

const PANEL_ICON_COLORS: Record<PanelMeta['section'], { bg: string; color: string }> = {
  summary:    { bg: '#EAF3DE', color: '#27500A' },
  pastoral:   { bg: '#FCEBEB', color: '#A32D2D' },
  attendance: { bg: '#E6F1FB', color: '#0C447C' },
  attainment: { bg: '#EEEDFE', color: '#3C3489' },
}

// ── Toggle component ─────────────────────────────────────────

function Toggle({ on, onChange, disabled }: { on: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={!disabled ? onChange : undefined}
      className={cn(
        'relative w-9 h-5 rounded-full border transition-all duration-200 flex-shrink-0',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1',
        disabled
          ? 'opacity-40 cursor-not-allowed border-stone-200 bg-stone-100'
          : on
          ? 'bg-brand-500 border-brand-500 cursor-pointer'
          : 'bg-stone-100 border-stone-200 cursor-pointer hover:border-stone-300',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200',
          on && !disabled ? 'translate-x-4' : 'translate-x-0',
        )}
      />
    </button>
  )
}

// ── Main sidebar ─────────────────────────────────────────────

export function CustomiseSidebar({
  role, draft, isDirty, onToggle, onSave, onReset, onClose,
}: CustomiseSidebarProps) {
  const sections = Array.from(new Set(PANEL_META.map((p) => p.section)))

  const visiblePanels = PANEL_META.filter((p) => p.roles.includes(role))
  const activeCount   = visiblePanels.filter((p) => draft[p.id]).length
  const isAllDefault  = JSON.stringify(draft) === JSON.stringify(DEFAULT_CONFIG)

  return (
    <aside className={cn(
      'bg-white border border-stone-200 rounded-2xl shadow-card-md',
      'flex flex-col',
      'w-full lg:w-80 flex-shrink-0',
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
        <div>
          <h2 className="text-sm font-semibold text-stone-900">Customise dashboard</h2>
          <p className="text-xs text-stone-400 mt-0.5">{activeCount} of {visiblePanels.length} panels shown</p>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Panel list */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {sections.map((section) => {
          const panels = PANEL_META.filter(
            (p) => p.section === section && p.roles.includes(role),
          )
          if (panels.length === 0) return null

          return (
            <div key={section}>
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-2">
                {SECTION_LABELS[section]}
              </p>
              <div className="space-y-1.5">
                {panels.map((panel) => {
                  const on      = draft[panel.id]
                  const { bg, color } = PANEL_ICON_COLORS[panel.section]

                  return (
                    <div
                      key={panel.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl border transition-all duration-150',
                        panel.required
                          ? 'border-stone-100 bg-stone-50 opacity-60'
                          : on
                          ? 'border-stone-200 bg-white hover:border-stone-300 cursor-pointer'
                          : 'border-stone-100 bg-stone-50 hover:border-stone-200 cursor-pointer',
                      )}
                      onClick={() => !panel.required && onToggle(panel.id)}
                    >
                      {/* Icon */}
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: bg, color }}
                      >
                        {PANEL_ICONS[panel.id]}
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-stone-800 leading-none mb-0.5">{panel.label}</p>
                        <p className="text-[11px] text-stone-400 leading-snug truncate">{panel.description}</p>
                      </div>

                      {/* Toggle or lock */}
                      {panel.required ? (
                        <span className="text-[10px] text-stone-300 flex-shrink-0">always on</span>
                      ) : (
                        <Toggle
                          on={on}
                          onChange={() => onToggle(panel.id)}
                          disabled={panel.required}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-stone-100 space-y-2">
        {isDirty && (
          <p className="text-xs text-amber-600 text-center">Unsaved changes</p>
        )}
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={isAllDefault}
            className="flex-1"
          >
            Reset to default
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onSave}
            className="flex-1"
          >
            {isDirty ? 'Save changes' : 'Done'}
          </Button>
        </div>
        <p className="text-[10px] text-stone-400 text-center">
          Layout is saved per role · {role === 'slt' ? 'Headteacher' : role === 'hoy' ? 'Year Lead' : 'Class Teacher'} view
        </p>
      </div>
    </aside>
  )
}
