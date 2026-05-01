import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'

const { createClientMock, createServerClientMock, adminCreateUser, adminDeleteUser, upsertProfile, serverSignIn } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  createServerClientMock: vi.fn(),
  adminCreateUser: vi.fn(),
  adminDeleteUser: vi.fn(),
  upsertProfile: vi.fn(),
  serverSignIn: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: createClientMock,
}))

vi.mock('@/lib/supabase/config', () => ({
  getSupabaseEnv: () => ({ url: 'https://example.supabase.co', anonKey: 'publishable-key' }),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: createServerClientMock,
}))

function request(body: Record<string, unknown>) {
  return new Request('http://localhost/api/auth/sign-up', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

const body = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@school.org',
  password: 'correct horse',
  curriculum: 'UK National Curriculum',
  phase: 'Primary',
  yearGroups: ['Year 6'],
  subjects: [],
  classProfile: ['Mixed ability'],
  lessonLength: '60 min',
  outputStyle: 'Balanced',
}

describe('POST /api/auth/sign-up', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key')
    adminCreateUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null })
    adminDeleteUser.mockResolvedValue({ error: null })
    upsertProfile.mockResolvedValue({ error: null })
    serverSignIn.mockResolvedValue({ error: null })
    createClientMock.mockReturnValue({
      auth: {
        admin: {
          createUser: adminCreateUser,
          deleteUser: adminDeleteUser,
        },
      },
      from: vi.fn(() => ({
        upsert: upsertProfile,
      })),
    })
    createServerClientMock.mockResolvedValue({
      auth: {
        signInWithPassword: serverSignIn,
      },
    })
  })

  it('creates a confirmed user, profile, and server session', async () => {
    const response = await POST(request(body))
    const json = await response.json() as { error: string | null }

    expect(response.status).toBe(200)
    expect(json.error).toBeNull()
    expect(adminCreateUser).toHaveBeenCalledWith({
      email: 'ada@school.org',
      password: 'correct horse',
      email_confirm: true,
      user_metadata: {
        first_name: 'Ada',
        last_name: 'Lovelace',
      },
    })
    expect(upsertProfile).toHaveBeenCalledWith({
      id: 'user-123',
      first_name: 'Ada',
      last_name: 'Lovelace',
      curriculum: 'UK National Curriculum',
      phase: 'Primary',
      year_groups: ['Year 6'],
      class_profile: ['Mixed ability'],
      subjects: [],
      lesson_length: '60 min',
      output_style: 'Balanced',
    }, { onConflict: 'id' })
    expect(serverSignIn).toHaveBeenCalledWith({
      email: 'ada@school.org',
      password: 'correct horse',
    })
  })

  it('cleans up the auth user if profile creation fails', async () => {
    upsertProfile.mockResolvedValue({ error: { message: 'profile failed' } })

    const response = await POST(request(body))
    const json = await response.json() as { error: string }

    expect(response.status).toBe(500)
    expect(json.error).toBe('profile failed')
    expect(adminDeleteUser).toHaveBeenCalledWith('user-123')
  })
})
