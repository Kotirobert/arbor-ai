'use client'

import type { Route } from 'next'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { getProfile, getSession, setProfile } from '@/lib/auth/mockSession'
import type { ChalkAiSession, TeacherProfile } from '@/types'

const YEAR_GROUPS = [
  'Reception',
  'Year 1',
  'Year 2',
  'Year 3',
  'Year 4',
  'Year 5',
  'Year 6',
  'Year 7',
  'Year 8',
  'Year 9',
  'Year 10',
  'Year 11',
]
const CLASS_TAGS = [
  'Mixed ability',
  'EAL students',
  'SEND pupils',
  'Pupil premium high',
  'G&T stretch needed',
  'Behaviour support',
]
const LESSON_LENGTHS = ['45 min', '60 min', '90 min', 'Double']
const OUTPUT_STYLES = ['Concise', 'Balanced', 'Detailed']

type MultiField = 'yearGroups' | 'classProfile'
type ChoiceField = 'lessonLength' | 'outputStyle'

interface ProfileSettingsProps {
  initialProfile?: TeacherProfile | null
  persistProfile?: (profile: TeacherProfile) => void
}

export function createDefaultProfile(session?: ChalkAiSession | null): TeacherProfile {
  return {
    firstName: session?.firstName ?? 'Teacher',
    lastName: session?.lastName ?? '',
    email: session?.email ?? '',
    country: 'UK',
    curriculum: 'UK National Curriculum',
    phase: 'Primary',
    yearGroups: [],
    subjects: [],
    classProfile: [],
    lessonLength: '60 min',
    outputStyle: 'Balanced',
  }
}

export function toggleProfileListValue(
  profile: TeacherProfile,
  field: MultiField,
  value: string,
): TeacherProfile {
  const current = profile[field] ?? []
  const next = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value]

  return { ...profile, [field]: next }
}

export function updateProfileChoice(
  profile: TeacherProfile,
  field: ChoiceField,
  value: string,
): TeacherProfile {
  return { ...profile, [field]: value }
}

function ChipButton({
  label,
  pressed,
  onClick,
}: {
  label: string
  pressed: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      style={{
        padding: '8px 14px',
        borderRadius: 100,
        border: `1px solid ${pressed ? 'var(--ink)' : 'var(--line-2)'}`,
        background: pressed ? 'var(--ink)' : 'var(--paper)',
        color: pressed ? 'var(--paper)' : 'var(--ink-2)',
        cursor: 'pointer',
        fontFamily: 'var(--f-body)',
        fontSize: 13,
      }}
    >
      {label}
    </button>
  )
}

function SegmentButton({
  label,
  pressed,
  onClick,
}: {
  label: string
  pressed: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      style={{
        padding: '10px 16px',
        borderRadius: 8,
        border: `1px solid ${pressed ? 'var(--ink)' : 'var(--line-2)'}`,
        background: pressed ? 'var(--paper-2)' : 'var(--paper)',
        color: 'var(--ink)',
        cursor: 'pointer',
        fontFamily: 'var(--f-body)',
        fontSize: 13,
        textAlign: 'left',
      }}
    >
      {label}
    </button>
  )
}

export function ProfileSettings({
  initialProfile,
  persistProfile = setProfile,
}: ProfileSettingsProps) {
  const [profile, setLocalProfile] = useState<TeacherProfile | null>(
    initialProfile === undefined ? null : initialProfile ?? createDefaultProfile(),
  )
  const [saved, setSaved] = useState(false)
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (initialProfile === undefined) {
      setLocalProfile(getProfile() ?? createDefaultProfile(getSession()))
    }
  }, [initialProfile])

  useEffect(() => {
    return () => {
      if (savedTimer.current) clearTimeout(savedTimer.current)
    }
  }, [])

  function toggle(field: MultiField, value: string) {
    setLocalProfile((current) => current ? toggleProfileListValue(current, field, value) : current)
  }

  function choose(field: ChoiceField, value: string) {
    setLocalProfile((current) => current ? updateProfileChoice(current, field, value) : current)
  }

  function save() {
    if (!profile) return
    persistProfile(profile)
    setSaved(true)
    if (savedTimer.current) clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setSaved(false), 2500)
  }

  if (!profile) {
    return (
      <div style={{ padding: '40px 24px', color: 'var(--ink-2)' }}>
        Loading...
      </div>
    )
  }

  return (
    <main style={{ padding: '40px 24px', maxWidth: 680, margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 32,
      }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Account settings</div>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 36, fontWeight: 400, margin: 0 }}>
            Profile settings
          </h1>
        </div>
        <Link
          href={'/chalkai' as Route}
          className="btn btn--ghost"
          style={{ flexShrink: 0 }}
        >
          Back to ChalkAI
        </Link>
      </div>

      <section style={{ marginBottom: 32 }}>
        <h2 className="side-group__title" style={{ marginBottom: 10 }}>Year groups you teach</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {YEAR_GROUPS.map((yearGroup) => (
            <ChipButton
              key={yearGroup}
              label={yearGroup}
              pressed={(profile.yearGroups ?? []).includes(yearGroup)}
              onClick={() => toggle('yearGroups', yearGroup)}
            />
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 className="side-group__title" style={{ marginBottom: 10 }}>Class profile</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {CLASS_TAGS.map((tag) => (
            <ChipButton
              key={tag}
              label={tag}
              pressed={(profile.classProfile ?? []).includes(tag)}
              onClick={() => toggle('classProfile', tag)}
            />
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 className="side-group__title" style={{ marginBottom: 10 }}>Typical lesson length</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 }}>
          {LESSON_LENGTHS.map((lessonLength) => (
            <SegmentButton
              key={lessonLength}
              label={lessonLength}
              pressed={profile.lessonLength === lessonLength}
              onClick={() => choose('lessonLength', lessonLength)}
            />
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 className="side-group__title" style={{ marginBottom: 10 }}>Output style</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          {OUTPUT_STYLES.map((outputStyle) => (
            <SegmentButton
              key={outputStyle}
              label={outputStyle}
              pressed={profile.outputStyle === outputStyle}
              onClick={() => choose('outputStyle', outputStyle)}
            />
          ))}
        </div>
      </section>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 10,
        paddingTop: 24,
        borderTop: '1px solid var(--line)',
      }}>
        <button type="button" onClick={save} className="btn btn--primary">
          {saved ? 'Saved ✓' : 'Save changes'}
        </button>
        <Link href={'/chalkai' as Route} className="btn btn--ghost">
          Back to ChalkAI
        </Link>
        <Link href={'/arbor/dashboard' as Route} className="btn btn--ghost">
          Open Arbor AI
        </Link>
      </div>
    </main>
  )
}
