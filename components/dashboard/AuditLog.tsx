'use client'

import { useEffect, useState } from 'react'

interface LogEntry {
  ts:      string
  message: string
}

const INITIAL_ENTRIES: LogEntry[] = [
  { ts: '09:14:23', message: 'data_import: 842 records parsed OK' },
  { ts: '09:14:25', message: 'model: attendance_risk computed for 47 pupils' },
  { ts: '09:14:26', message: 'model: behaviour_spike flagged 12 pupils' },
  { ts: '09:14:27', message: 'insight: pastoral_priority_list generated' },
  { ts: '09:14:28', message: 'cache: dashboard_state refreshed' },
]

const LIVE_MESSAGES = [
  'query: year_9_summary requested',
  'model: attendance_trend recomputed',
  'alert: new PA threshold breach — p4',
  'cache: priority_list invalidated, rebuilding',
  'model: risk_profiles updated (12 pupils)',
  'audit: role_switch slt → hoy recorded',
  'insight: behaviour_hotspot analysis complete',
]

function nowTs() {
  return new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

export function AuditLog() {
  const [entries, setEntries] = useState<LogEntry[]>(INITIAL_ENTRIES)
  const [liveIdx, setLiveIdx] = useState(0)

  useEffect(() => {
    if (liveIdx >= LIVE_MESSAGES.length) return
    const id = setTimeout(() => {
      const entry: LogEntry = { ts: nowTs(), message: LIVE_MESSAGES[liveIdx] }
      setEntries((prev: LogEntry[]) => [...prev.slice(-8), entry])
      setLiveIdx((i: number) => i + 1)
    }, 4000 + liveIdx * 100)
    return () => clearTimeout(id)
  }, [liveIdx])

  return (
    <div className="bg-[#0F1117] rounded-2xl p-4 font-mono text-[11px]">
      <div className="text-[#4B5563] mb-2 text-[10px] tracking-wider">// SYSTEM LOG</div>
      <div className="space-y-1 max-h-28 overflow-y-auto">
        {entries.map((entry: LogEntry, i: number) => (
          <div key={`${entry.ts}-${i}`} className="audit-line flex gap-2">
            <span className="text-[#374151] select-none flex-shrink-0">[{entry.ts}]</span>
            <span className="text-[#6EE7B7]">{entry.message}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
