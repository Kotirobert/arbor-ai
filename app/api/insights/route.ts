import { NextResponse } from 'next/server'
import { generateChatResponse } from '@/lib/ai'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as {
      query?:               string
      role?:                string
      schoolContext?:       string
      conversationHistory?: string
    }

    const query = body.query?.trim() ?? ''
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const result = await generateChatResponse(
      query,
      body.role ?? 'slt',
      body.schoolContext,
      body.conversationHistory,
    )

    return NextResponse.json({
      response:    result.response,
      generatedAt: result.generatedAt,
    })
  } catch (err) {
    console.error('[insights]', err)
    return NextResponse.json({ error: 'Failed to generate insight' }, { status: 500 })
  }
}
