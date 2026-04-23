'use client'

import { useMemo, useState, useEffect } from 'react'
import type { ResourceType, TeacherProfile } from '@/types'
import type { GeneratorInput } from '@/lib/chalkai/resourceTemplates'
import { cn } from '@/lib/utils'

interface Props {
  type:    ResourceType
  profile: TeacherProfile | null
  onGenerate: (input: GeneratorInput) => void
}

const YEAR_GROUPS = ['Reception', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 7', 'Year 8']
const DURATIONS   = ['30 mins', '45 mins', '60 mins', '90 mins']
const SUBJECTS    = ['Maths', 'English', 'Science', 'History', 'Geography', 'RE', 'Computing', 'Art', 'PE', 'PSHE']
const TONES       = ['Professional \u2022 Warm', 'Concise', 'Reassuring', 'Firm but fair']
const PURPOSES    = ['Behaviour update', 'Homework concern', 'Progress celebration', 'Upcoming trip', 'General update']

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--ink3)]">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-[var(--ink3)]">{hint}</span>}
    </label>
  )
}

const inputCls = 'h-10 rounded-lg border border-[var(--border2)] bg-[var(--surface2)] px-3 text-[13px] text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--ink3)] focus:border-[var(--amber-border)]'
const textareaCls = 'rounded-lg border border-[var(--border2)] bg-[var(--surface2)] px-3 py-2 text-[13px] text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--ink3)] focus:border-[var(--amber-border)]'

export function GeneratorForm({ type, profile, onGenerate }: Props) {
  const defaultYear = profile?.yearGroups?.[0] ?? 'Year 4'
  const defaultSubject = profile?.subjects?.[0] ?? 'Maths'
  const defaultDuration = profile?.lessonLength ? `${profile.lessonLength} mins` : '45 mins'

  const [topic, setTopic]         = useState('')
  const [yearGroup, setYearGroup] = useState(defaultYear)
  const [subject, setSubject]     = useState<string>(defaultSubject)
  const [duration, setDuration]   = useState(defaultDuration)
  const [notes, setNotes]         = useState('')
  const [tone, setTone]           = useState(TONES[0])
  const [purpose, setPurpose]     = useState(PURPOSES[0])
  const [numQuestions, setNumQ]   = useState('10')

  // When type changes, keep values but clear topic.
  useEffect(() => { setTopic('') }, [type])

  const valid = topic.trim().length > 0

  const handleSubmit = () => {
    if (!valid) return
    const base: GeneratorInput = {
      type, topic, yearGroup, subject, duration, notes,
    }
    if (type === 'quiz')         base.numQuestions = numQuestions
    if (type === 'parent_email') { base.tone = tone; base.purpose = purpose }
    onGenerate(base)
  }

  const title = useMemo(() => {
    switch (type) {
      case 'lesson_plan':  return 'Lesson plan details'
      case 'worksheet':    return 'Worksheet details'
      case 'quiz':         return 'Quiz details'
      case 'parent_email': return 'Email details'
    }
  }, [type])

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-[var(--ink3)]">Step 2</div>
        <h3 className="font-display text-[18px] font-medium text-[var(--ink)]">{title}</h3>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Topic">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={type === 'parent_email' ? 'e.g. Homework focus this half-term' : 'e.g. Fractions \u2014 halves and quarters'}
            className={inputCls}
            autoFocus
          />
        </Field>

        <Field label="Year group">
          <select value={yearGroup} onChange={(e) => setYearGroup(e.target.value)} className={cn(inputCls, 'appearance-none pr-8')}>
            {YEAR_GROUPS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </Field>

        <Field label="Subject">
          <select value={subject} onChange={(e) => setSubject(e.target.value)} className={cn(inputCls, 'appearance-none pr-8')}>
            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>

        {type !== 'parent_email' && (
          <Field label={type === 'quiz' ? 'Time allowed' : 'Lesson length'}>
            <select value={duration} onChange={(e) => setDuration(e.target.value)} className={cn(inputCls, 'appearance-none pr-8')}>
              {DURATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
        )}

        {type === 'quiz' && (
          <Field label="Number of questions">
            <input
              type="number"
              min={4}
              max={12}
              value={numQuestions}
              onChange={(e) => setNumQ(e.target.value)}
              className={inputCls}
            />
          </Field>
        )}

        {type === 'parent_email' && (
          <>
            <Field label="Purpose">
              <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className={cn(inputCls, 'appearance-none pr-8')}>
                {PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Tone">
              <select value={tone} onChange={(e) => setTone(e.target.value)} className={cn(inputCls, 'appearance-none pr-8')}>
                {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </>
        )}
      </div>

      <Field
        label="Notes (optional)"
        hint={profile ? `Draws on your profile: ${profile.yearGroups.slice(0, 2).join(', ')} \u00b7 ${profile.curriculum} \u00b7 ${profile.outputStyle} style.` : undefined}
      >
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Class context, SEND needs, vocabulary, prior learning…"
          className={textareaCls}
        />
      </Field>

      <div className="flex items-center justify-between gap-4 pt-2">
        <div className="text-[11px] text-[var(--ink3)]">
          Output is a formatted draft you can refine. No data leaves your browser in this demo.
        </div>
        <button
          onClick={handleSubmit}
          disabled={!valid}
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-transform',
            valid
              ? 'bg-[var(--amber)] text-[#0e0f0d] hover:scale-[1.02]'
              : 'cursor-not-allowed bg-[var(--surface3)] text-[var(--ink3)]',
          )}
        >
          Generate
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  )
}
