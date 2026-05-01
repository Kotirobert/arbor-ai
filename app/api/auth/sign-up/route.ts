import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { getSupabaseEnv } from '@/lib/supabase/config'

interface SignUpRequestBody {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  curriculum?: string
  phase?: string
  yearGroups?: string[]
  subjects?: string[]
  classProfile?: string[]
  lessonLength?: string
  outputStyle?: string
}

type SupabaseAdminError = { message?: string } | null

type SupabaseAdminClient = {
  auth: {
    admin: {
      createUser: (params: {
        email: string
        password: string
        email_confirm: boolean
        user_metadata: Record<string, string>
      }) => Promise<{ data: { user: { id: string } | null } | null; error: SupabaseAdminError }>
      deleteUser: (id: string) => Promise<{ error: SupabaseAdminError }>
    }
  }
  from: (table: string) => {
    upsert: (
      values: Record<string, unknown>,
      options?: { onConflict?: string },
    ) => Promise<{ error: SupabaseAdminError }>
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  let body: SignUpRequestBody

  try {
    body = await req.json() as SignUpRequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const validationError = validateBody(body)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 })
  }

  try {
    const { url } = getSupabaseEnv()
    const admin = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }) as unknown as SupabaseAdminClient

    const { data, error } = await admin.auth.admin.createUser({
      email: body.email!.trim(),
      password: body.password!,
      email_confirm: true,
      user_metadata: {
        first_name: body.firstName!.trim(),
        last_name: body.lastName!.trim(),
      },
    })

    if (error || !data?.user) {
      return NextResponse.json({ error: error?.message ?? 'Sign-up failed.' }, { status: 400 })
    }

    const profileError = await upsertProfile(admin, data.user.id, body)
    if (profileError) {
      await admin.auth.admin.deleteUser(data.user.id)
      return NextResponse.json({ error: profileError }, { status: 500 })
    }

    const authClient = await createServerSupabaseClient()
    const { error: signInError } = await authClient.auth.signInWithPassword({
      email: body.email!.trim(),
      password: body.password!,
    })

    if (signInError) {
      return NextResponse.json({ error: signInError.message ?? 'Sign in failed.' }, { status: 500 })
    }

    return NextResponse.json({ error: null })
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error, 'Sign-up failed.') }, { status: 500 })
  }
}

async function upsertProfile(
  admin: SupabaseAdminClient,
  userId: string,
  body: SignUpRequestBody,
): Promise<string | null> {
  const { error } = await admin.from('profiles').upsert({
    id: userId,
    first_name: body.firstName!.trim(),
    last_name: body.lastName!.trim(),
    curriculum: body.curriculum,
    phase: body.phase,
    year_groups: body.yearGroups,
    class_profile: body.classProfile,
    subjects: body.subjects,
    lesson_length: body.lessonLength,
    output_style: body.outputStyle,
  }, { onConflict: 'id' })

  return error?.message ?? null
}

function validateBody(body: SignUpRequestBody): string | null {
  if (!body.firstName?.trim()) return 'First name is required'
  if (!body.lastName?.trim()) return 'Last name is required'
  if (!body.email?.trim()) return 'Email is required'
  if (!body.password || body.password.length < 6) return 'Password must be at least 6 characters'
  if (!body.curriculum?.trim()) return 'Curriculum is required'
  if (!body.phase?.trim()) return 'Phase is required'
  if (!Array.isArray(body.yearGroups)) return 'Year groups are required'
  if (!Array.isArray(body.subjects)) return 'Subjects are required'
  if (!Array.isArray(body.classProfile)) return 'Class profile is required'
  if (!body.lessonLength?.trim()) return 'Lesson length is required'
  if (!body.outputStyle?.trim()) return 'Output style is required'
  return null
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback
}
