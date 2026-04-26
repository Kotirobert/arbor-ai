'use client'

import type { PIIFinding } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  findings:    PIIFinding[]
  onEdit:      () => void
  onContinue?: () => void
}

const TYPE_LABELS: Record<string, string> = {
  studentName: 'student name',
  staffName:   'staff name',
  schoolName:  'school name',
  email:       'email address',
  phone:       'phone number',
  postcode:    'postcode',
}

export function PIIWarningBanner({ findings, onEdit, onContinue }: Props) {
  const isBlocked = findings.some((f) => f.severity === 'block')

  return (
    <div
      className={cn(
        'rounded-xl border px-4 py-3 text-[13px]',
        isBlocked
          ? 'border-red-500/30 bg-red-500/10 text-red-300'
          : 'border-amber-500/30 bg-amber-500/10 text-amber-200',
      )}
    >
      <div className="mb-2 flex items-center gap-2 font-semibold">
        <span>{isBlocked ? '🔒' : '⚠️'}</span>
        <span>
          {isBlocked
            ? 'Personal data detected — please remove before sending to AI'
            : 'We spotted personal information and replaced it to keep things GDPR-safe'}
        </span>
      </div>

      <ul className="mb-3 space-y-1 pl-1 text-[12px] opacity-90">
        {findings.map((f, i) => (
          <li key={i}>
            {isBlocked
              ? `Found ${TYPE_LABELS[f.type] ?? f.type}: "${f.match}" — please remove this before continuing.`
              : `"${f.match}" looks like a ${TYPE_LABELS[f.type] ?? f.type} — replaced with ${f.type === 'studentName' ? '[STUDENT]' : f.type === 'staffName' ? '[STAFF]' : '[REDACTED]'}.`}
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="rounded-full border border-current px-3 py-1 text-[12px] font-medium opacity-90 hover:opacity-100"
        >
          Edit prompt
        </button>
        {!isBlocked && onContinue && (
          <button
            onClick={onContinue}
            className="rounded-full bg-amber-500 px-3 py-1 text-[12px] font-medium text-[#0e0f0d] hover:bg-amber-400"
          >
            Continue with redactions
          </button>
        )}
      </div>
    </div>
  )
}
