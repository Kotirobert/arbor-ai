import { describe, expect, it, vi } from 'vitest'
import {
  buildPasswordResetCallbackUrl,
  requestPasswordReset,
  signInWithPassword,
  signOutOfSupabase,
  signUpWithProfile,
  updatePassword,
} from '../supabaseAuth'

function createSupabaseStub() {
  return {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
      updateUser: vi.fn().mockResolvedValue({ error: null }),
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

  it('builds the password reset callback URL through the auth callback route', () => {
    expect(buildPasswordResetCallbackUrl('https://chalkai.example/')).toBe(
      'https://chalkai.example/auth/callback?next=%2Freset-password',
    )
  })

  it('requests a password reset email with the reset-password redirect', async () => {
    const supabase = createSupabaseStub()

    await expect(requestPasswordReset('ada@school.org', 'https://chalkai.example', supabase)).resolves.toEqual({
      error: null,
    })

    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('ada@school.org', {
      redirectTo: 'https://chalkai.example/auth/callback?next=%2Freset-password',
    })
  })

  it('updates the password through Supabase auth', async () => {
    const supabase = createSupabaseStub()

    await expect(updatePassword('new-password', supabase)).resolves.toEqual({ error: null })

    expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'new-password' })
  })
})
