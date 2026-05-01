import { NextResponse } from 'next/server'
import { buildChatMessages } from '@/lib/chalkai/chatClient'
import { summariseMemory } from '@/lib/chalkai/memoryStore'
import type { MemoryPromptSummary, MemoryStoreClient } from '@/lib/chalkai/memoryStore'
import { createClient as createServerClient } from '@/lib/supabase/server'
import type { TeacherProfile } from '@/types'

interface ChatRequestBody {
  history?: Array<{ role: 'user' | 'assistant'; body: string }>
  message?: string
  profile?: TeacherProfile | null
}

interface OpenAIChatResponse {
  choices: Array<{ message?: { content?: string } }>
}

function getApiKey(): string {
  return process.env.OPENAI_API_KEY ?? ''
}

async function loadTeacherMemory(): Promise<MemoryPromptSummary | null> {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase.auth.getUser()
    const userId = data.user?.id

    if (error || !userId) return null

    const result = await summariseMemory(userId, { supabase: supabase as unknown as MemoryStoreClient })
    if (result.error || !result.data.text.trim()) return null
    return result.data
  } catch {
    return null
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  let body: ChatRequestBody

  try {
    body = await req.json() as ChatRequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const message = body.message?.trim()
  if (!message) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  const apiKey = getApiKey()
  if (apiKey.length <= 10) {
    return NextResponse.json({
      reply: 'ChalkAI chat is not configured yet. Add OPENAI_API_KEY to .env.local to enable live replies.',
    })
  }

  const memory = await loadTeacherMemory()
  const messages = buildChatMessages(body.history ?? [], message, body.profile, memory)

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o',
      max_tokens: 2000,
      temperature: 0.7,
      messages,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { error?: { message?: string } }
    console.error('[chalkai/chat]', error)
    return NextResponse.json(
      { error: 'Generation failed', message: error.error?.message ?? 'Chat generation failed.' },
      { status: 500 },
    )
  }

  const data = await response.json() as OpenAIChatResponse
  const reply = data.choices[0]?.message?.content?.trim() ?? ''
  return NextResponse.json({ reply })
}
