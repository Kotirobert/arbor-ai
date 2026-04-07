import { clsx, type ClassValue } from 'clsx'
import type { UserRole } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// ── Formatting ────────────────────────────────────────────────

export function formatPct(value: number): string {
  return `${Math.round(value)}%`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit',
  })
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} at ${formatTime(iso)}`
}

// ── Attendance colour coding ──────────────────────────────────

export function attColour(pct: number): { bar: string; text: string } {
  if (pct < 80)  return { bar: '#EF4444', text: '#991B1B' }
  if (pct < 90)  return { bar: '#F59E0B', text: '#92580A' }
  return          { bar: '#22C55E', text: '#166534' }
}

// ── Role helpers ──────────────────────────────────────────────

export const ROLE_LABELS: Record<UserRole, string> = {
  slt: 'SLT',
  hoy: 'HOY',
  teacher: 'Teacher',
}

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  slt: 'Senior Leadership — all pupils',
  hoy: 'Head of Year — Year 9',
  teacher: 'Teacher — Class 9A',
}

// ── CSV parsing (real Arbor export shape) ─────────────────────

export interface RawArborRow {
  [key: string]: string
}

export function parseArborCsv(raw: string): {
  pupils: RawArborRow[]
  headers: string[]
} {
  const lines = raw.trim().split('\n')
  if (lines.length < 2) return { pupils: [], headers: [] }
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  const pupils = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']))
  })
  return { pupils, headers }
}

// ── Risk badge helper ─────────────────────────────────────────

export function riskBadgeProps(level: string): { label: string; className: string } {
  switch (level) {
    case 'high':   return { label: 'High',   className: 'badge-red'    }
    case 'medium': return { label: 'Medium', className: 'badge-amber'  }
    case 'low':    return { label: 'Low',    className: 'badge-blue'   }
    default:       return { label: 'None',   className: 'badge-neutral'}
  }
}
