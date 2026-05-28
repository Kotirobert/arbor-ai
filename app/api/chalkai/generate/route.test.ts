import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'
import type { GenerateRequest } from '@/types'

const { mockGetUser, mockIsConfigured, mockRouteToModel, mockSummariseMemory } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockIsConfigured: vi.fn(),
  mockRouteToModel: vi.fn(),
  mockSummariseMemory: vi.fn(),
}))

vi.mock('@/lib/chalkai/openaiClient', () => ({
  isConfigured: mockIsConfigured,
}))

vi.mock('@/lib/chalkai/modelRouter', () => ({
  routeToModel: mockRouteToModel,
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
  const actual = await importOriginal<typeof import('@/lib/chalkai/memoryStore')>()
  return {
    ...actual,
    summariseMemory: mockSummariseMemory,
  }
})

const requestBody: GenerateRequest = {
  resourceType: 'worksheet',
  input: 'Fractions practice',
  profile: {
    curriculum: 'UK National Curriculum',
    yearGroup: 'Year 4',
    subjectSpecialism: 'Maths',
    classProfile: 'Mixed ability',
    lessonLength: '60 minutes',
    outputStyle: 'Concise',
  },
}

describe('POST /api/chalkai/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsConfigured.mockReturnValue(true)
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    mockSummariseMemory.mockResolvedValue({
      data: { text: '', source: 'empty', itemCount: 0 },
      error: null,
    })
    mockRouteToModel.mockResolvedValue({ type: 'text', output: 'Generated worksheet' })
  })

  it('includes authenticated user memory in the enriched generation prompt', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null })
    mockSummariseMemory.mockResolvedValue({
      data: {
        text: 'resource_signal: saved_resource:worksheet:year-4:maths — prefers short worked examples',
        source: 'items',
        itemCount: 1,
      },
      error: null,
    })

    const response = await POST(new Request('http://localhost/api/chalkai/generate', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    }) as never)

    expect(response.status).toBe(200)
    expect(mockSummariseMemory).toHaveBeenCalledWith('user-123', expect.objectContaining({ supabase: expect.any(Object) }))
    expect(mockRouteToModel.mock.calls[0][0]).toContain('[TEACHER MEMORY]')
    expect(mockRouteToModel.mock.calls[0][0]).toContain('prefers short worked examples')
  })
})
