import { describe, it, expect } from 'vitest'
import { buildEnrichedPrompt } from '../promptEnricher'
import type { GenerateRequest } from '@/types'

const baseProfile: GenerateRequest['profile'] = {
  curriculum: 'KS2 / England National Curriculum',
  yearGroup: 'Year 4',
  subjectSpecialism: 'Maths',
  classProfile: 'Mixed ability, 2 EAL',
  lessonLength: '60 minutes',
  outputStyle: 'Practical and hands-on',
}

it('builds a prompt for lesson_plan', () => {
  const prompt = buildEnrichedPrompt({
    resourceType: 'lesson_plan',
    input: 'Teach fractions — halves and quarters',
    profile: baseProfile,
    resourceSpecificFields: {},
  })
  expect(prompt).toContain('KS2 / England National Curriculum')
  expect(prompt).toContain('Year 4')
  expect(prompt).toContain('Teach fractions')
  expect(prompt).toContain('Mixed ability')
})

it('never injects school name', () => {
  const prompt = buildEnrichedPrompt({
    resourceType: 'worksheet',
    input: 'Fractions worksheet',
    profile: baseProfile,
  })
  expect(prompt).not.toContain('Greenfield')
  expect(prompt).not.toContain('St ')
})

it('skips empty profile fields', () => {
  const prompt = buildEnrichedPrompt({
    resourceType: 'quiz',
    input: 'Romans quiz',
    profile: { ...baseProfile, classProfile: '', outputStyle: '' },
  })
  expect(prompt).not.toContain('Class profile:')
  expect(prompt).not.toContain('Preferred style:')
})

it('includes year group always', () => {
  const prompt = buildEnrichedPrompt({
    resourceType: 'parent_email',
    input: 'Update on homework',
    profile: baseProfile,
  })
  expect(prompt).toContain('Year 4')
})
