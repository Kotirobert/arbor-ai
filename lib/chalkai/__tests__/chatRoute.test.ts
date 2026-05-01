import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildChatMessages } from '../chatClient'
import { POST } from '@/app/api/chalkai/chat/route'
import type { TeacherProfile } from '@/types'

const { mockGetUser, mockSummariseMemory } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockSummariseMemory: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: vi.fn(),
  })),
}))

vi.mock('@/lib/chalkai/memoryStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../memoryStore')>()
  return {
    ...actual,
    summariseMemory: mockSummariseMemory,
  }
})

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
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    mockSummariseMemory.mockResolvedValue({
      data: { text: '', source: 'empty', itemCount: 0 },
      error: null,
    })
  })

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

  it('injects teacher memory after profile context', () => {
    const messages = buildChatMessages(
      [],
      'plan fractions',
      profile,
      { text: 'Prefers retrieval practice and short exit tickets.', source: 'summary', itemCount: 1 },
    )

    const system = messages[0].content
    expect(system).toContain('Teacher profile:\n')
    expect(system).toContain('Teacher memory:\nPrefers retrieval practice and short exit tickets.')
    expect(system.indexOf('Teacher profile:')).toBeLessThan(system.indexOf('Teacher memory:'))
  })

  it('omits teacher memory when there is no memory text', () => {
    const messages = buildChatMessages(
      [],
      'plan fractions',
      profile,
      { text: '', source: 'empty', itemCount: 0 },
    )

    expect(messages[0].content).not.toContain('Teacher memory:')
  })

  it('omits teacher memory when the summary contains blocked PII', () => {
    const messages = buildChatMessages(
      [],
      'plan fractions',
      profile,
      { text: 'Contact preference is ada@example.com', source: 'summary', itemCount: 1 },
    )

    expect(messages[0].content).not.toContain('Teacher memory:')
    expect(messages[0].content).not.toContain('ada@example.com')
  })

  it('keeps teacher memory inside the prompt budget', () => {
    const longMemory = 'Uses worked examples. '.repeat(120)
    const messages = buildChatMessages(
      [],
      'plan fractions',
      profile,
      { text: longMemory, source: 'summary', itemCount: 1 },
    )

    const memoryBlock = messages[0].content.split('Teacher memory:\n')[1]
    expect(memoryBlock).toHaveLength(1200)
    expect(memoryBlock).toMatch(/…$/)
  })
})

describe('POST /api/chalkai/chat', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    mockSummariseMemory.mockResolvedValue({
      data: { text: '', source: 'empty', itemCount: 0 },
      error: null,
    })
  })

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

  it('loads memory for the authenticated user and includes it in the OpenAI prompt', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'sk-test-key-long-enough')
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null })
    mockSummariseMemory.mockResolvedValue({
      data: {
        text: 'Prefers retrieval practice before independent tasks.',
        source: 'summary',
        itemCount: 1,
      },
      error: null,
    })
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: 'Here is a plan.' } }] }), { status: 200 }),
    )

    const response = await POST(
      new Request('http://localhost/api/chalkai/chat', {
        method: 'POST',
        body: JSON.stringify({ history: [], message: 'Help me plan a lesson', profile }),
      }),
    )

    const requestBody = JSON.parse(fetchMock.mock.calls[0][1]?.body as string) as {
      messages: Array<{ role: string; content: string }>
    }
    expect(response.status).toBe(200)
    expect(mockSummariseMemory).toHaveBeenCalledWith('user-123', expect.objectContaining({ supabase: expect.any(Object) }))
    expect(requestBody.messages[0].content).toContain('Teacher memory:')
    expect(requestBody.messages[0].content).toContain('Prefers retrieval practice before independent tasks.')
  })

  it('continues without memory when Supabase auth is unavailable', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'sk-test-key-long-enough')
    mockGetUser.mockRejectedValue(new Error('Missing NEXT_PUBLIC_SUPABASE_URL'))
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: 'Here is a plan.' } }] }), { status: 200 }),
    )

    const response = await POST(
      new Request('http://localhost/api/chalkai/chat', {
        method: 'POST',
        body: JSON.stringify({ history: [], message: 'Help me plan a lesson', profile }),
      }),
    )

    const requestBody = JSON.parse(fetchMock.mock.calls[0][1]?.body as string) as {
      messages: Array<{ role: string; content: string }>
    }
    expect(response.status).toBe(200)
    expect(mockSummariseMemory).not.toHaveBeenCalled()
    expect(requestBody.messages[0].content).not.toContain('Teacher memory:')
  })
})
