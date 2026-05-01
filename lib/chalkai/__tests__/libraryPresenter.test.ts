import { describe, expect, it } from 'vitest'
import { getResourceDisplayMeta } from '../libraryPresenter'
import type { SavedResource } from '../resourceStore'

function resource(overrides: Partial<SavedResource> = {}): SavedResource {
  return {
    id: 'res-1',
    type: 'text',
    resourceType: 'lesson_plan',
    title: 'Fractions for Year 4',
    output: 'A starter activity on equivalent fractions.\n\nThen a main task.',
    createdAt: '2026-01-01T12:00:00.000Z',
    ...overrides,
  }
}

describe('getResourceDisplayMeta', () => {
  it('formats type, date and text preview for saved text resources', () => {
    expect(getResourceDisplayMeta(resource())).toEqual({
      typeLabel: 'Lesson plan',
      dateLabel: '1 Jan 2026',
      preview: 'A starter activity on equivalent fractions. Then a main task.',
    })
  })

  it('uses stable previews for non-text outputs', () => {
    expect(getResourceDisplayMeta(resource({ type: 'image', resourceType: 'image' })).preview)
      .toBe('Generated image')
    expect(getResourceDisplayMeta(resource({ type: 'pptx', resourceType: 'presentation' })).preview)
      .toBe('Presentation file')
  })
})
