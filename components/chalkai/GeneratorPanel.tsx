'use client'

import { useState } from 'react'
import { RESOURCE_TYPES, mockOutputFor, type GeneratorInput } from '@/lib/chalkai/resourceTemplates'
import { ResourceTypeCard } from './ResourceTypeCard'
import { GeneratorForm } from './GeneratorForm'
import { ResourceOutput } from './ResourceOutput'
import type { ResourceType, TeacherProfile, SavedResource } from '@/types'

interface Props {
  profile: TeacherProfile | null
}

interface GeneratedState {
  input:    GeneratorInput
  title:    string
  markdown: string
}

const HISTORY_KEY = 'chalkai-history'

function appendHistory(r: SavedResource) {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY)
    const list: SavedResource[] = raw ? JSON.parse(raw) : []
    list.unshift(r)
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 50)))
  } catch { /* noop */ }
}

function refine(markdown: string, action: string): string {
  switch (action) {
    case 'shorter':
      return markdown
        .split('\n')
        .filter((l, i) => i % 2 === 0 || l.startsWith('#') || l.startsWith('**'))
        .slice(0, 30)
        .join('\n') + '\n\n_Shortened draft — review before using._'
    case 'scaffolding':
      return markdown + `

## Extra scaffolding
- Sentence starters: "I know that \u2026 because \u2026", "The key feature is \u2026"
- Worked example card on each desk
- Paired talk before individual writing
- Word bank with definitions and one example each`
    case 'plain-english':
      return markdown.replace(/pupils/gi, 'children').replace(/misconception/gi, 'common mistake').replace(/retrieval/gi, 'quick recall')
        + '\n\n_Rewritten in plainer language._'
    case 'challenge':
      return markdown + `

## Challenge extension
- Open-ended task: design your own example and justify why it works.
- Peer-teaching: explain one step to a partner who tackles a harder variant next.
- Transfer problem: apply the idea to an unfamiliar context (real-world or cross-subject).`
    default:
      return markdown
  }
}

export function GeneratorPanel({ profile }: Props) {
  const [selected, setSelected] = useState<ResourceType>('lesson_plan')
  const [gen, setGen]           = useState<GeneratedState | null>(null)
  const [saved, setSaved]       = useState(false)

  const handleGenerate = (input: GeneratorInput) => {
    const { title, markdown } = mockOutputFor(input)
    setGen({ input, title, markdown })
    setSaved(false)
  }

  const handleRefine = (action: string) => {
    if (!gen) return
    setGen({ ...gen, markdown: refine(gen.markdown, action) })
    setSaved(false)
  }

  const handleSave = () => {
    if (!gen) return
    const rec: SavedResource = {
      id:        `res-${Date.now()}`,
      type:      gen.input.type,
      title:     gen.title,
      topic:     gen.input.topic,
      yearGroup: gen.input.yearGroup,
      subject:   gen.input.subject,
      content:   gen.markdown,
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
                onClick={() => setSelected(rt.type)}
              />
            ))}
          </div>
        </div>

        <div className="chalkai-divider" />

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <GeneratorForm type={selected} profile={profile} onGenerate={handleGenerate} />
        </div>
      </div>

      {/* Right: output */}
      <div className="mt-5 min-h-[520px] flex-1 md:mt-0 md:min-h-[680px]">
        {gen ? (
          <ResourceOutput
            type={gen.input.type}
            title={gen.title}
            markdown={gen.markdown}
            onRefine={handleRefine}
            onSave={handleSave}
            saved={saved}
          />
        ) : (
          <EmptyOutput />
        )}
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
        Pick a resource type, fill in topic and year group, and press <span className="font-medium text-[var(--ink)]">Generate</span>. You can refine and save to history afterwards.
      </p>
    </div>
  )
}
