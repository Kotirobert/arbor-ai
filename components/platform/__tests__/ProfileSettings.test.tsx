import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { TeacherProfile } from '@/types'
import {
  ProfileSettings,
  toggleProfileListValue,
  updateProfileChoice,
} from '../ProfileSettings'

const baseProfile: TeacherProfile = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  country: 'UK',
  curriculum: 'UK National Curriculum',
  phase: 'Primary',
  yearGroups: ['Year 4'],
  subjects: [],
  classProfile: ['Mixed ability'],
  lessonLength: '60 min',
  outputStyle: 'Balanced',
}

describe('ProfileSettings', () => {
  it('renders editable controls from the supplied profile', () => {
    const html = renderToStaticMarkup(<ProfileSettings initialProfile={baseProfile} />)

    expect(html).toContain('Profile settings')
    expect(html).toContain('Year groups you teach')
    expect(html).toMatch(/aria-pressed="true"[^>]*>Year 4/)
    expect(html).toMatch(/aria-pressed="false"[^>]*>Year 5/)
    expect(html).toMatch(/aria-pressed="true"[^>]*>60 min/)
    expect(html).toMatch(/aria-pressed="true"[^>]*>Balanced/)
    expect(html).toContain('Save changes')
  })

  it('renders product navigation so users can leave settings', () => {
    const html = renderToStaticMarkup(<ProfileSettings initialProfile={baseProfile} />)

    expect(html).toContain('href="/chalkai"')
    expect(html).toContain('Back to ChalkAI')
    expect(html).toContain('href="/arbor/dashboard"')
    expect(html).toContain('Open Arbor AI')
  })

  it('renders editable defaults when no profile has been created yet', () => {
    const html = renderToStaticMarkup(<ProfileSettings initialProfile={null} />)

    expect(html).toContain('Profile settings')
    expect(html).not.toContain('Loading')
    expect(html).toMatch(/aria-pressed="true"[^>]*>60 min/)
    expect(html).toMatch(/aria-pressed="true"[^>]*>Balanced/)
    expect(html).toContain('Save changes')
  })

  it('toggles multi-select profile fields without mutating the original profile', () => {
    const withYear5 = toggleProfileListValue(baseProfile, 'yearGroups', 'Year 5')
    const withoutYear4 = toggleProfileListValue(baseProfile, 'yearGroups', 'Year 4')

    expect(withYear5.yearGroups).toEqual(['Year 4', 'Year 5'])
    expect(withoutYear4.yearGroups).toEqual([])
    expect(baseProfile.yearGroups).toEqual(['Year 4'])
  })

  it('updates segmented profile choices without changing unrelated fields', () => {
    const updated = updateProfileChoice(baseProfile, 'outputStyle', 'Detailed')

    expect(updated.outputStyle).toBe('Detailed')
    expect(updated.lessonLength).toBe('60 min')
    expect(updated.yearGroups).toEqual(['Year 4'])
  })
})
