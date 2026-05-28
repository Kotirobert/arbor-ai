import { createClient } from '@/lib/supabase/client'
import type { TeacherProfile } from '@/types'

type SupabaseAuthError = { message?: string } | null

type SupabaseAuthClient = {
  auth: {
    signInWithPassword: (credentials: {
      email: string
      password: string
    }) => Promise<{ error: SupabaseAuthError }>
    resetPasswordForEmail: (
      email: string,
      options: { redirectTo: string },
    ) => Promise<{ error: SupabaseAuthError }>
    updateUser: (attributes: { password: string }) => Promise<{ error: SupabaseAuthError }>
    signUp: (credentials: {
      email: string
      password: string
      options?: { data?: Record<string, string> }
    }) => Promise<{ data: { user: { id: string } | null } | null; error: SupabaseAuthError }>
    signOut: () => Promise<{ error: SupabaseAuthError }>
  }
  from: (table: string) => {
    insert: (values: Record<string, unknown>) => Promise<{ error: SupabaseAuthError }>
  }
}

type AuthActionResult = {
  error: string | null
}

type SignUpFetcher = typeof fetch

export type ProfileSignUpInput = TeacherProfile & {
  password: string
}

export async function signInWithPassword(
  email: string,
  password: string,
  supabase?: SupabaseAuthClient,
): Promise<AuthActionResult> {
  try {
    const client = supabase ?? createClient()
    const { error } = await client.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  } catch (error) {
    return { error: getErrorMessage(error, 'Sign in failed.') }
  }
}

export function buildPasswordResetCallbackUrl(origin: string): string {
  const callbackUrl = new URL('/auth/callback', origin.endsWith('/') ? origin : `${origin}/`)
  callbackUrl.searchParams.set('next', '/reset-password')
  return callbackUrl.toString()
}

export async function requestPasswordReset(
  email: string,
  origin: string,
  supabase?: SupabaseAuthClient,
): Promise<AuthActionResult> {
  try {
    const client = supabase ?? createClient()
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: buildPasswordResetCallbackUrl(origin),
    })
    return { error: error?.message ?? null }
  } catch (error) {
    return { error: getErrorMessage(error, 'Password reset failed.') }
  }
}

export async function updatePassword(
  password: string,
  supabase?: SupabaseAuthClient,
): Promise<AuthActionResult> {
  try {
    const client = supabase ?? createClient()
    const { error } = await client.auth.updateUser({ password })
    return { error: error?.message ?? null }
  } catch (error) {
    return { error: getErrorMessage(error, 'Password update failed.') }
  }
}

export async function signUpWithProfile(
  profile: ProfileSignUpInput,
  _supabase?: SupabaseAuthClient,
  fetcher: SignUpFetcher = fetch,
): Promise<AuthActionResult> {
  try {
    const response = await fetcher('/api/auth/sign-up', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        password: profile.password,
        curriculum: profile.curriculum,
        phase: profile.phase,
        yearGroups: profile.yearGroups,
        subjects: profile.subjects,
        classProfile: profile.classProfile,
        lessonLength: profile.lessonLength,
        outputStyle: profile.outputStyle,
      }),
    })
    const body = await response.json().catch(() => ({})) as { error?: string | null }

    if (!response.ok || body.error) {
      return { error: body.error ?? 'Sign-up failed.' }
    }

    return { error: null }
  } catch (error) {
    return { error: getErrorMessage(error, 'Sign-up failed.') }
  }
}

export async function signOutOfSupabase(
  supabase?: SupabaseAuthClient,
): Promise<AuthActionResult> {
  try {
    const client = supabase ?? createClient()
    const { error } = await client.auth.signOut()
    return { error: error?.message ?? null }
  } catch (error) {
    return { error: getErrorMessage(error, 'Sign out failed.') }
  }
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback
}
