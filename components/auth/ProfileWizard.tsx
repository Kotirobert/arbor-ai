'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createMockSession, setProfile, setLastTool } from '@/lib/auth/mockSession'
import type { TeacherProfile } from '@/types'

const CURRICULA   = ['UK National Curriculum', 'Scottish CfE', 'Welsh Curriculum', 'IB', 'Other']
const PHASES      = [
  { label: 'Primary',       desc: 'Reception – Year 6' },
  { label: 'Secondary',     desc: 'Year 7 – Year 11' },
  { label: 'Sixth Form / FE', desc: 'Year 12+' },
  { label: 'SEN School',    desc: 'Specialist provision' },
]
const YEAR_GROUPS = ['Reception','Year 1','Year 2','Year 3','Year 4','Year 5','Year 6','Year 7','Year 8','Year 9','Year 10','Year 11']
const CLASS_TAGS  = ['Mixed ability','EAL students','SEND pupils','Pupil premium high','G&T stretch needed','Behaviour support']
const LESSON_LENS = ['45 min','60 min','90 min','Double']
const STYLES      = [
  { label: 'Concise',   desc: 'Bullets and short prose. Fastest to scan. Good for experienced teachers.' },
  { label: 'Balanced',  desc: 'Structured, with enough detail to deliver cold. Our default.', recommended: true },
  { label: 'Detailed',  desc: 'Verbose. Teacher notes, rationale, alternative tasks. Good for NQTs or cover.' },
]

interface State {
  firstName: string; lastName: string; email: string; password: string
  curriculum: string; phase: string
  yearGroups: string[]; classProfile: string[]; lessonLength: string
  outputStyle: string
}

const INITIAL: State = {
  firstName: '', lastName: '', email: '', password: '',
  curriculum: 'UK National Curriculum', phase: 'Primary',
  yearGroups: [], classProfile: [], lessonLength: '60 min',
  outputStyle: 'Balanced',
}

const STEPS = [
  { title: 'Account',             hint: 'Name, school email, password' },
  { title: 'Curriculum & phase',  hint: 'What you teach, where' },
  { title: 'Year groups & class', hint: 'Mixed ability, EAL, SEND…' },
  { title: 'Output style',        hint: 'Concise, detailed, balanced' },
]

function Chip({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '10px 16px', border: `1px solid ${on ? 'var(--ink)' : 'var(--line-2)'}`,
        borderRadius: 100, background: on ? 'var(--ink)' : 'var(--paper)',
        fontFamily: 'var(--f-body)', fontSize: 14, cursor: 'pointer',
        color: on ? 'var(--paper)' : 'var(--ink-2)', transition: 'all 0.15s ease',
      }}
    >
      {label}
    </button>
  )
}

function SegBtn({ label, desc, on, onClick }: { label: string; desc?: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '16px 18px', border: `1px solid ${on ? 'var(--ink)' : 'var(--line-2)'}`,
        background: on ? 'var(--paper-2)' : 'var(--paper)', borderRadius: 10,
        cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease',
      }}
    >
      <div style={{ fontFamily: 'var(--f-body)', fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>{label}</div>
      {desc && <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 3 }}>{desc}</div>}
    </button>
  )
}

export function ProfileWizard() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [state, setState] = useState<State>(INITIAL)
  const [error, setError] = useState<string | null>(null)

  const update = <K extends keyof State>(k: K, v: State[K]) => setState((s) => ({ ...s, [k]: v }))
  const toggleMulti = (k: 'yearGroups' | 'classProfile', val: string) =>
    setState((s) => {
      const arr = s[k] as string[]
      return { ...s, [k]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val] }
    })

  const next = () => {
    setError(null)
    if (step === 0) {
      if (!state.firstName.trim() || !state.lastName.trim() || !state.email.trim() || !state.password.trim()) {
        setError('Please fill in all fields to continue.')
        return
      }
      if (state.password.length < 6) { setError('Password must be at least 6 characters.'); return }
    }
    if (step === 2 && state.yearGroups.length === 0) { setError('Pick at least one year group.'); return }
    setStep((s) => Math.min(s + 1, 3))
  }

  const finish = () => {
    const profile: TeacherProfile = {
      firstName: state.firstName, lastName: state.lastName, email: state.email,
      country: 'UK', curriculum: state.curriculum, phase: state.phase,
      yearGroups: state.yearGroups, subjects: [], classProfile: state.classProfile,
      lessonLength: state.lessonLength, outputStyle: state.outputStyle,
    }
    createMockSession({ email: state.email, firstName: state.firstName, lastName: state.lastName, role: 'teacher' })
    setProfile(profile)
    setLastTool('chalkai')
    router.push('/chalkai' as any)
  }

  return (
    <div className="auth">
      {/* Left aside */}
      <aside className="auth__aside">
        <Link href="/" style={{ fontFamily: 'var(--f-display)', fontSize: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--ink)', display: 'inline-block' }} />
          ChalkAI
        </Link>

        <div>
          <div className="eyebrow" style={{ marginBottom: 16 }}>Set up your profile</div>
          <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 32, lineHeight: 1.2, margin: '0 0 24px', fontWeight: 400 }}>
            A <i>five-minute</i> profile saves you typing the same context into every prompt.
          </h2>
          <p className="muted" style={{ fontSize: 14, maxWidth: '32ch', margin: 0 }}>
            ChalkAI remembers your year groups, curriculum, lesson length and class profile — and silently attaches them to every resource.
          </p>

          <ol style={{ listStyle: 'none', padding: 0, margin: '48px 0 0', display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 320 }}>
            {STEPS.map((s, i) => (
              <li key={s.title} style={{
                display: 'flex', gap: 16, padding: '14px 0',
                borderBottom: i < STEPS.length - 1 ? '1px solid var(--line)' : undefined,
              }}>
                <div style={{
                  fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: 22,
                  color: i === step ? 'var(--chalk-green)' : i < step ? 'var(--ink)' : 'var(--ink-3)',
                  width: 28, flexShrink: 0, lineHeight: 1.2,
                }}>0{i + 1}</div>
                <div style={{ fontSize: 14 }}>
                  <div style={{ fontWeight: 500, color: i === step ? 'var(--ink)' : 'var(--ink-2)' }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{s.hint}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: 0 }}>
          Already have an account?{' '}
          <Link href="/sign-in" style={{ color: 'var(--ink)', textDecoration: 'underline' }}>Sign in</Link>
        </p>
      </aside>

      {/* Right main */}
      <main className="auth__main">
        <div style={{ width: '100%', maxWidth: 520 }}>
          {/* Progress bars */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 36 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 3, borderRadius: 100,
                background: i < step ? 'var(--chalk-green)' : i === step ? 'var(--ink)' : 'var(--line)',
              }} />
            ))}
          </div>

          <div style={{ fontSize: 12, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
            Step 0{step + 1} · {STEPS[step].title}
          </div>

          {/* Step 0 — account */}
          {step === 0 && (
            <>
              <h1 className="h1" style={{ fontSize: 40 }}>Create your <i>ChalkAI</i>&nbsp;account.</h1>
              <p className="muted" style={{ fontSize: 15, marginTop: 16 }}>
                Email and password — no SSO, no school code.
              </p>
              <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="field">
                    <label className="field__label">First name</label>
                    <input className="input" placeholder="Sarah" value={state.firstName} onChange={(e) => update('firstName', e.target.value)} />
                  </div>
                  <div className="field">
                    <label className="field__label">Last name</label>
                    <input className="input" placeholder="Hartley" value={state.lastName} onChange={(e) => update('lastName', e.target.value)} />
                  </div>
                </div>
                <div className="field">
                  <label className="field__label">School email</label>
                  <input className="input" type="email" placeholder="s.hartley@hillcrest.sch.uk" value={state.email} onChange={(e) => update('email', e.target.value)} />
                </div>
                <div className="field">
                  <label className="field__label">Password</label>
                  <input className="input" type="password" placeholder="At least 6 characters" value={state.password} onChange={(e) => update('password', e.target.value)} />
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Use a passphrase. We never share your email.</div>
                </div>
              </div>
            </>
          )}

          {/* Step 1 — curriculum */}
          {step === 1 && (
            <>
              <h1 className="h1" style={{ fontSize: 40 }}>Where do you <i>teach?</i></h1>
              <p className="muted" style={{ fontSize: 15, marginTop: 16 }}>This helps us align to the right curriculum and age-appropriate language.</p>
              <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div className="field">
                  <label className="field__label">Curriculum</label>
                  <select className="select" value={state.curriculum} onChange={(e) => update('curriculum', e.target.value)}>
                    {CURRICULA.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="field__label">School phase</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
                    {PHASES.map((p) => (
                      <SegBtn key={p.label} label={p.label} desc={p.desc} on={state.phase === p.label} onClick={() => update('phase', p.label)} />
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Step 2 — classes */}
          {step === 2 && (
            <>
              <h1 className="h1" style={{ fontSize: 40 }}>Who&rsquo;s in <i>your room?</i></h1>
              <p className="muted" style={{ fontSize: 15, marginTop: 16 }}>Pick all that apply.</p>
              <div style={{ marginTop: 36 }}>
                <div className="field__label" style={{ marginBottom: 8 }}>Year groups you teach</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {YEAR_GROUPS.map((y) => (
                    <Chip key={y} label={y} on={state.yearGroups.includes(y)} onClick={() => toggleMulti('yearGroups', y)} />
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 32 }}>
                <div className="field__label" style={{ marginBottom: 8 }}>Class profile</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {CLASS_TAGS.map((t) => (
                    <Chip key={t} label={t} on={state.classProfile.includes(t)} onClick={() => toggleMulti('classProfile', t)} />
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 32 }}>
                <div className="field__label" style={{ marginBottom: 8 }}>Typical lesson length</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {LESSON_LENS.map((l) => (
                    <SegBtn key={l} label={l} on={state.lessonLength === l} onClick={() => update('lessonLength', l)} />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Step 3 — output style */}
          {step === 3 && (
            <>
              <h1 className="h1" style={{ fontSize: 40 }}>How do you <i>like it written?</i></h1>
              <p className="muted" style={{ fontSize: 15, marginTop: 16 }}>You can change this any time, and override per-resource.</p>
              <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {STYLES.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => update('outputStyle', s.label)}
                    style={{
                      padding: 20, border: `1px solid ${state.outputStyle === s.label ? 'var(--ink)' : 'var(--line-2)'}`,
                      background: state.outputStyle === s.label ? 'var(--paper-2)' : 'var(--paper)',
                      borderRadius: 10, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontFamily: 'var(--f-body)', fontSize: 15, fontWeight: 500, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {s.label}
                      {s.recommended && <span className="tag tag--green" style={{ marginLeft: 8 }}>Recommended</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 3 }}>{s.desc}</div>
                  </button>
                ))}
              </div>

              <div style={{
                marginTop: 32, padding: 20, background: 'var(--chalk-green-soft)',
                border: '1px solid var(--chalk-green-line)', borderRadius: 10,
                display: 'flex', gap: 14, alignItems: 'flex-start'
              }}>
                <svg style={{ width: 20, height: 20, color: 'var(--chalk-green)', flexShrink: 0, marginTop: 2, stroke: 'currentColor', strokeWidth: 1.5, fill: 'none' }} viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/>
                </svg>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>You&rsquo;re all set — nearly.</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 4 }}>
                    We&rsquo;ll drop you into the ChalkAI assistant with your profile attached. You can switch to Arbor AI from the sidebar any time.
                  </div>
                </div>
              </div>
            </>
          )}

          {error && <p style={{ fontSize: 13, color: 'var(--red)', marginTop: 16 }}>{error}</p>}

          {/* Navigation */}
          <div style={{
            marginTop: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            paddingTop: 24, borderTop: '1px solid var(--line)'
          }}>
            <button
              type="button"
              onClick={() => { setError(null); setStep((s) => Math.max(0, s - 1)) }}
              className="btn btn--ghost"
              style={{ visibility: step === 0 ? 'hidden' : 'visible' }}
            >
              <svg className="ico" viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>
              Back
            </button>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Step {step + 1} of 4</div>
            {step < 3 ? (
              <button type="button" onClick={next} className="btn btn--primary">
                Continue
                <svg className="ico" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </button>
            ) : (
              <button type="button" onClick={finish} className="btn btn--primary">
                Open ChalkAI
                <svg className="ico" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
