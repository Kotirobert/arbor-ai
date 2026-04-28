import { describe, expect, it, vi } from 'vitest'
import { buildChatMessages } from '../chatClient'
import { POST } from '@/app/api/chalkai/chat/route'
import type { TeacherProfile } from '@/types'

const profile: TeacherProfile = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  country: 'United Kingdom',
  curriculum: 'UK National Curriculum',
  phase: 'Primary',
  yearGroups: ['Year 4'],
  subjects: ['Maths'],
  classProfile: ['Mixed ability', 'EAL learners'],
  lessonLength: '60 minutes',
  outputStyle: 'Practical and concise',
}

describe('buildChatMessages', () => {
  it('includes history then the new user message', () => {
    const messages = buildChatMessages(
      [
        { role: 'user', body: 'hello' },
        { role: 'assistant', body: 'hi' },
      ],
      'follow-up question',
    )

    expect(messages).toHaveLength(4)
    expect(messages[1]).toMatchObject({ role: 'user', content: 'hello' })
    expect(messages[2]).toMatchObject({ role: 'assistant', content: 'hi' })
    expect(messages[3]).toMatchObject({ role: 'user', content: 'follow-up question' })
  })

  it('injects teacher profile context into the system message', () => {
    const messages = buildChatMessages([], 'plan fractions', profile)

    expect(messages[0].role).toBe('system')
    expect(messages[0].content).toContain('Year 4')
    expect(messages[0].content).toContain('UK National Curriculum')
    expect(messages[0].content).toContain('Mixed ability')
    expect(messages[0].content).toContain('Practical and concise')
  })
})

describe('POST /api/chalkai/chat', () => {
  it('returns a friendly fallback when OPENAI_API_KEY is not configured', async () => {
    vi.stubEnv('OPENAI_API_KEY', '')

    const response = await POST(
      new Request('http://localhost/api/chalkai/chat', {
        method: 'POST',
        body: JSON.stringify({ history: [], message: 'Help me plan a lesson', profile }),
      }),
    )
    const body = await response.json() as { reply: string }

    expect(response.status).toBe(200)
    expect(body.reply).toContain('OPENAI_API_KEY')
  })
})
