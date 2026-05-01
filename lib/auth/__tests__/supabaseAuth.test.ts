import { describe, expect, it, vi } from 'vitest'
import { signInWithPassword, signOutOfSupabase, signUpWithProfile } from '../supabaseAuth'

function createSupabaseStub() {
  return {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  }
}

describe('Supabase auth helpers', () => {
  it('signs in with email and password', async () => {
    const supabase = createSupabaseStub()

    await expect(signInWithPassword('ada@school.org', 'correct horse', supabase)).resolves.toEqual({
      error: null,
    })

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'ada@school.org',
      password: 'correct horse',
    })
  })

  it('creates the account through the server route', async () => {
    const supabase = createSupabaseStub()
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ error: null }),
    })

    await expect(
      signUpWithProfile(
        {
          firstName: 'Ada',
          lastName: 'Lovelace',
          email: 'ada@school.org',
          password: 'correct horse',
          country: 'UK',
          curriculum: 'UK National Curriculum',
          phase: 'Primary',
          yearGroups: ['Year 6'],
          subjects: [],
          classProfile: ['Mixed ability'],
          lessonLength: '60 min',
          outputStyle: 'Balanced',
        },
        supabase,
        fetcher,
      ),
    ).resolves.toEqual({ error: null })

    expect(fetcher).toHaveBeenCalledWith('/api/auth/sign-up', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }))
    const request = JSON.parse(fetcher.mock.calls[0][1].body as string)
    expect(request).toMatchObject({
      email: 'ada@school.org',
      password: 'correct horse',
      firstName: 'Ada',
      lastName: 'Lovelace',
      curriculum: 'UK National Curriculum',
      phase: 'Primary',
      yearGroups: ['Year 6'],
      classProfile: ['Mixed ability'],
      subjects: [],
      lessonLength: '60 min',
      outputStyle: 'Balanced',
    })
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled()
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('returns sign-up route errors without signing in', async () => {
    const supabase = createSupabaseStub()
    const fetcher = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'User already registered' }),
    })

    await expect(
      signUpWithProfile(
        {
          firstName: 'Ada',
          lastName: 'Lovelace',
          email: 'ada@school.org',
          password: 'correct horse',
          country: 'UK',
          curriculum: 'UK National Curriculum',
          phase: 'Primary',
          yearGroups: [],
          subjects: [],
          classProfile: [],
          lessonLength: '60 min',
          outputStyle: 'Balanced',
        },
        supabase,
        fetcher,
      ),
    ).resolves.toEqual({ error: 'User already registered' })

    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled()
  })

  it('signs out through Supabase auth', async () => {
    const supabase = createSupabaseStub()

    await expect(signOutOfSupabase(supabase)).resolves.toEqual({ error: null })

    expect(supabase.auth.signOut).toHaveBeenCalled()
  })
})
