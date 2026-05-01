import { describe, expect, it } from 'vitest'
import {
  buildAssistantGenerateRequest,
  detectAssistantResourceType,
} from '../assistantResourceIntent'
import type { TeacherProfile } from '@/types'

const profile: TeacherProfile = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  country: 'United Kingdom',
  curriculum: 'UK National Curriculum',
  phase: 'Primary',
  yearGroups: ['Year 4'],
  subjects: ['Science'],
  classProfile: ['Mixed ability'],
  lessonLength: '45 minutes',
  outputStyle: 'Concise',
}

describe('detectAssistantResourceType', () => {
  it('routes image requests from assistant chat to the image generator', () => {
    expect(detectAssistantResourceType('Create a labelled image of the water cycle for Year 5')).toBe('image')
  })

  it('routes slide requests from assistant chat to the presentation generator', () => {
    expect(detectAssistantResourceType('Make me 6 slides about fractions')).toBe('presentation')
  })

  it('leaves ordinary teaching questions in chat', () => {
    expect(detectAssistantResourceType('How could I explain equivalent fractions?')).toBeNull()
  })
})

describe('buildAssistantGenerateRequest', () => {
  it('builds a presentation generate request with inferred slide count and profile context', () => {
    const request = buildAssistantGenerateRequest({
      message: 'Make me 6 slides about the Romans for Year 3',
      resourceType: 'presentation',
      profile,
    })

    expect(request.resourceType).toBe('presentation')
    expect(request.input).toBe('Make me 6 slides about the Romans for Year 3')
    expect(request.profile).toMatchObject({
      curriculum: 'UK National Curriculum',
      yearGroup: 'Year 3',
      subjectSpecialism: 'Science',
      classProfile: 'Mixed ability',
    })
    expect(request.resourceSpecificFields).toMatchObject({
      slideCount: 6,
      speakerNotes: true,
    })
  })

  it('builds an image generate request with inferred use and orientation', () => {
    const request = buildAssistantGenerateRequest({
      message: 'Generate a portrait poster image showing plant pollination',
      resourceType: 'image',
      profile,
    })

    expect(request.resourceType).toBe('image')
    expect(request.profile.yearGroup).toBe('Year 4')
    expect(request.resourceSpecificFields).toMatchObject({
      intendedUse: 'poster',
      orientation: 'portrait',
    })
  })
})
