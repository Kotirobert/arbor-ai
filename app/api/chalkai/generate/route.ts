import { NextRequest, NextResponse } from 'next/server'
import type { GenerateRequest } from '@/types'
import { scanForPII } from '@/lib/chalkai/piiScanner'
import { buildEnrichedPrompt } from '@/lib/chalkai/promptEnricher'
import { routeToModel } from '@/lib/chalkai/modelRouter'
import { isConfigured } from '@/lib/chalkai/openaiClient'
import { summariseMemory } from '@/lib/chalkai/memoryStore'
import type { MemoryPromptSummary, MemoryStoreClient } from '@/lib/chalkai/memoryStore'
import { createClient as createServerClient } from '@/lib/supabase/server'

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(req: NextRequest): Promise<NextResponse<any>> {
  if (!isConfigured()) {
    return NextResponse.json(
      { type: 'error', error: 'API_KEY_NOT_CONFIGURED', message: 'Add OPENAI_API_KEY to .env.local to enable generation.' },
      { status: 503 },
    )
  }

  let body: GenerateRequest
  try {
    body = await req.json() as GenerateRequest
  } catch {
    return NextResponse.json(
      { type: 'error', error: 'GENERATION_FAILED', message: 'Invalid request body.' },
      { status: 400 },
    )
  }

  const piiResult = scanForPII(body.input)

  if (piiResult.blocked) {
    return NextResponse.json({
      type: 'pii_blocked',
      piiFindings: piiResult.findings,
      sanitised: piiResult.sanitised,
    })
  }

  const sanitisedBody: GenerateRequest = { ...body, input: piiResult.sanitised }
  const memory = await loadTeacherMemory()
  const enrichedPrompt = buildEnrichedPrompt(sanitisedBody, memory)

  try {
    const result = await routeToModel(enrichedPrompt, sanitisedBody)

    if (result.type === 'text') {
      return NextResponse.json({ ...result, piiFindings: piiResult.findings })
    }
    return NextResponse.json(result)
  } catch (err) {
    console.error('[chalkai/generate]', err)
    return NextResponse.json(
      { type: 'error', error: 'GENERATION_FAILED', message: err instanceof Error ? err.message : 'Generation failed.' },
      { status: 500 },
    )
  }
}
