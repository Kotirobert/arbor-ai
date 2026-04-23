import { NextResponse } from 'next/server'
import { getPupils } from '@/lib/data/queries'
import type { UserRole } from '@/types'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const rawRole = searchParams.get('role') ?? 'slt'
    const validRoles: UserRole[] = ['slt', 'hoy', 'teacher']
    const role: UserRole = validRoles.includes(rawRole as UserRole) ? (rawRole as UserRole) : 'slt'

    const pupils = await getPupils({
      role,
      yearGroup: role === 'hoy' ? '9' : undefined,
      className: role === 'teacher' ? '9A' : undefined,
    })

    return NextResponse.json({ pupils })
  } catch (err) {
    console.error('[pupils]', err)
    return NextResponse.json({ error: 'Failed to fetch pupils' }, { status: 500 })
  }
}
