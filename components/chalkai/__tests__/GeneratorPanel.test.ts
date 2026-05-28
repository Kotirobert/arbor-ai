import { describe, expect, it } from 'vitest'
import type { GenerateFormInput } from '@/types'
import { buildRefinedGenerateInput } from '../GeneratorPanel'

const baseInput: GenerateFormInput = {
  resourceType: 'worksheet',
  topic: 'Fractions practice',
  yearGroup: 'Year 4',
  subject: 'Maths',
}

describe('buildRefinedGenerateInput', () => {
  it.each([
    ['shorter', 'Make this shorter.'],
    ['scaffolding', 'Add more scaffolding for lower-ability pupils.'],
    ['plain-english', 'Rewrite in plain English.'],
    ['challenge', 'Add a challenge extension task.'],
  ])('appends the %s refinement instruction to the topic', (action, instruction) => {
    const refined = buildRefinedGenerateInput(baseInput, action)

    expect(refined).toEqual({
      ...baseInput,
      topic: `Fractions practice\n\n${instruction}`,
    })
  })

  it('leaves the input unchanged for unknown refinement actions', () => {
    expect(buildRefinedGenerateInput(baseInput, 'unknown')).toEqual(baseInput)
  })
})
