'use client'

import { useEffect, useState } from 'react'
import type { ResourceType } from '@/types'

interface Props {
  resourceType: ResourceType
}

const TEXT_TIPS = [
  'Thinking about your class…',
  'Structuring the content…',
  'Applying differentiation…',
  'Adding assessment ideas…',
  'Polishing the output…',
]

const PRESENTATION_STEPS = [
  'Checking your prompt…',
  'Writing slide content…',
  'Designing theme & generating visuals…',
  'Assembling presentation…',
]

export function LoadingState({ resourceType }: Props) {
  const [tipIndex, setTipIndex] = useState(0)
  const [step, setStep]         = useState(0)

  useEffect(() => {
    if (resourceType === 'presentation') {
      const timer = setInterval(() => setStep((s) => Math.min(s + 1, PRESENTATION_STEPS.length - 1)), 4000)
      return () => clearInterval(timer)
    }
    const timer = setInterval(() => setTipIndex((i) => (i + 1) % TEXT_TIPS.length), 2500)
    return () => clearInterval(timer)
  }, [resourceType])

  if (resourceType === 'presentation') {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-10">
        <div className="flex w-full max-w-xs flex-col gap-3">
          {PRESENTATION_STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all ${
                  i < step
                    ? 'bg-[var(--green)] text-[#0e0f0d]'
                    : i === step
                    ? 'bg-[var(--amber)] text-[#0e0f0d]'
                    : 'bg-[var(--surface3)] text-[var(--ink3)]'
                }`}
              >
                {i < step ? '✓' : i + 1}
              </div>
              <span
                className={`text-[13px] transition-all ${
                  i === step ? 'font-medium text-[var(--ink)]' : i < step ? 'text-[var(--ink3)] line-through' : 'text-[var(--ink3)]'
                }`}
              >
                {label}
                {i === step && <span className="ml-1 animate-pulse">…</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-10">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border2)] border-t-[var(--amber)]" />
      <p className="text-[13px] text-[var(--ink2)] transition-all">{TEXT_TIPS[tipIndex]}</p>
    </div>
  )
}
