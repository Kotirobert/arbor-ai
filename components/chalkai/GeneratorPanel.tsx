'use client'

import { useState } from 'react'
import { RESOURCE_TYPES } from '@/lib/chalkai/resourceTemplates'
import { ResourceTypeCard } from './ResourceTypeCard'
import { GeneratorForm } from './GeneratorForm'
import { ResourceOutput } from './ResourceOutput'
import { PIIWarningBanner } from './PIIWarningBanner'
import { LoadingState } from './LoadingState'
import type {
  ResourceType, TeacherProfile, SavedResource,
  GenerateFormInput, GenerateResponse, PIIFinding,
} from '@/types'

interface Props {
  profile: TeacherProfile | null
}

type PanelState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'pii_blocked'; findings: PIIFinding[]; sanitised: string }
  | { status: 'done'; response: GenerateResponse & { type: 'text' | 'image' | 'pptx' }; piiFindings?: PIIFinding[]; formInput: GenerateFormInput }
  | { status: 'error'; message: string; isKeyMissing: boolean }

const HISTORY_KEY = 'chalkai-history'

function appendHistory(r: SavedResource) {
  if (typeof window === 'undefined') return
  try {
    const raw  = window.localStorage.getItem(HISTORY_KEY)
    const list: SavedResource[] = raw ? JSON.parse(raw) : []
    list.unshift(r)
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 50)))
  } catch { /* noop */ }
}

function profileToRequestProfile(p: TeacherProfile | null, yearGroup: string) {
  return {
    curriculum:        p?.curriculum    ?? '',
    yearGroup,
    subjectSpecialism: p?.subjects?.[0] ?? '',
    classProfile:      p?.classProfile?.join(', ') ?? '',
    lessonLength:      p?.lessonLength  ?? '',
    outputStyle:       p?.outputStyle   ?? '',
  }
}

export function GeneratorPanel({ profile }: Props) {
  const [selected, setSelected]   = useState<ResourceType>('lesson_plan')
  const [state, setState]         = useState<PanelState>({ status: 'idle' })
  const [saved, setSaved]         = useState(false)
  const [lastInput, setLastInput] = useState<GenerateFormInput | null>(null)

  const handleGenerate = async (input: GenerateFormInput) => {
    setLastInput(input)
    setState({ status: 'loading' })

    const body = {
      resourceType: input.resourceType,
      input: input.topic,
      profile: profileToRequestProfile(profile, input.yearGroup),
      resourceSpecificFields: {
        subject:      input.subject      ?? '',
        duration:     input.duration     ?? '',
        notes:        input.notes        ?? '',
        numQuestions: input.numQuestions ?? '',
        tone:         input.tone         ?? '',
        purpose:      input.purpose      ?? '',
        intendedUse:  input.intendedUse  ?? '',
        orientation:  input.orientation  ?? '',
        objectives:   input.objectives   ?? '',
        slideCount:   input.slideCount   ?? 8,
        speakerNotes: input.speakerNotes ?? true,
      },
    }

    try {
      const res  = await fetch('/api/chalkai/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const data = await res.json() as GenerateResponse

      if (data.type === 'pii_blocked') {
        setState({ status: 'pii_blocked', findings: data.piiFindings, sanitised: data.sanitised })
        return
      }
      if (data.type === 'error') {
        setState({
          status: 'error',
          message: data.message,
          isKeyMissing: data.error === 'API_KEY_NOT_CONFIGURED',
        })
        return
      }
      setState({
        status: 'done',
        response: data as GenerateResponse & { type: 'text' | 'image' | 'pptx' },
        piiFindings: data.type === 'text' ? data.piiFindings : [],
        formInput: input,
      })
      setSaved(false)
    } catch {
      setState({ status: 'error', message: 'Network error — please try again.', isKeyMissing: false })
    }
  }

  const handleSave = () => {
    if (state.status !== 'done' || !lastInput) return
    const { response } = state
    const rec: SavedResource = {
      id:        `res-${Date.now()}`,
      type:      selected,
      title:     lastInput.topic,
      topic:     lastInput.topic,
      yearGroup: lastInput.yearGroup,
      subject:   lastInput.subject,
      content:   response.output,
      createdAt: new Date().toISOString(),
    }
    appendHistory(rec)
    setSaved(true)
    setTimeout(() => setSaved(false), 2200)
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-7xl flex-col px-4 pb-6 pt-4 md:flex-row md:gap-5 md:px-6">
      {/* Left: type picker + form */}
      <div className="flex w-full flex-col gap-5 md:w-[440px] md:flex-shrink-0">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-[var(--ink3)]">Step 1</div>
          <h3 className="font-display text-[18px] font-medium text-[var(--ink)]">Choose a resource</h3>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {RESOURCE_TYPES.map((rt) => (
              <ResourceTypeCard
                key={rt.type}
                meta={rt}
                selected={selected === rt.type}
                onClick={() => { setSelected(rt.type); setState({ status: 'idle' }) }}
              />
            ))}
          </div>
        </div>

        <div className="chalkai-divider" />

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          {state.status === 'pii_blocked' && (
            <PIIWarningBanner
              findings={state.findings}
              onEdit={() => setState({ status: 'idle' })}
            />
          )}
          {state.status !== 'pii_blocked' && (
            <GeneratorForm
              type={selected}
              profile={profile}
              onGenerate={handleGenerate}
            />
          )}
        </div>
      </div>

      {/* Right: output */}
      <div className="mt-5 min-h-[520px] flex-1 md:mt-0 md:min-h-[680px]">
        {state.status === 'loading' && <LoadingState resourceType={selected} />}

        {state.status === 'error' && (
          <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--border2)] bg-[var(--surface)]/40 p-10 text-center">
            {state.isKeyMissing ? (
              <>
                <div className="text-[13px] font-medium text-[var(--amber)]">OpenAI API key not configured</div>
                <p className="max-w-sm text-[12px] text-[var(--ink3)]">
                  Add <code className="rounded bg-[var(--surface3)] px-1.5 py-0.5">OPENAI_API_KEY</code> to{' '}
                  <code className="rounded bg-[var(--surface3)] px-1.5 py-0.5">.env.local</code> to enable generation.
                </p>
              </>
            ) : (
              <>
                <div className="text-[13px] font-medium text-red-400">Generation failed</div>
                <p className="max-w-sm text-[12px] text-[var(--ink3)]">{state.message}</p>
              </>
            )}
          </div>
        )}

        {state.status === 'done' && (
          <div className="flex h-full flex-col gap-3">
            {state.piiFindings && state.piiFindings.length > 0 && (
              <PIIWarningBanner
                findings={state.piiFindings}
                onEdit={() => setState({ status: 'idle' })}
                onContinue={() => {
                  if (state.status === 'done') {
                    setState({ ...state, piiFindings: [] })
                  }
                }}
              />
            )}
            <ResourceOutput
              response={state.response}
              topic={lastInput?.topic ?? ''}
              onSave={handleSave}
              saved={saved}
            />
          </div>
        )}

        {(state.status === 'idle' || state.status === 'pii_blocked') && <EmptyOutput />}
      </div>
    </div>
  )
}

function EmptyOutput() {
  return (
    <div className="flex h-full min-h-[520px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border2)] bg-[var(--surface)]/40 p-10 text-center">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border2)] bg-[var(--surface)]">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v18M3 12h18" />
        </svg>
      </div>
      <h3 className="font-serif text-[22px] italic text-[var(--ink)]">Your draft appears here</h3>
      <p className="mt-2 max-w-sm text-[13px] text-[var(--ink2)]">
        Pick a resource type, fill in topic and year group, and press <span className="font-medium text-[var(--ink)]">Generate</span>. You can save to history afterwards.
      </p>
    </div>
  )
}
