import { NextResponse, type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const nextPath = getSafeNextPath(requestUrl.searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(new URL(nextPath, request.url))
    }
  }

  const signInUrl = new URL('/sign-in', request.url)
  signInUrl.searchParams.set('error', 'Password reset link is invalid or expired.')
  return NextResponse.redirect(signInUrl)
}

function getSafeNextPath(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return '/reset-password'
  }

  return next
}
