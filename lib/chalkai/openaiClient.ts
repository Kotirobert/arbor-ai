import type { ResourceType } from '@/types'
import { getSystemRole as enricherGetSystemRole } from './promptEnricher'

export interface TextResult {
  content: string
}

export interface JSONResult<T = unknown> {
  data: T
}

function getKey(): string {
  return process.env.OPENAI_API_KEY ?? ''
}

async function callOpenAI(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getKey()}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: maxTokens,
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } }
    throw new Error(`OpenAI ${res.status}: ${err.error?.message ?? 'Unknown error'}`)
  }

  const data = await res.json() as { choices: Array<{ message: { content: string } }> }
  return data.choices[0]?.message?.content?.trim() ?? ''
}

export async function generateText(systemPrompt: string, userPrompt: string): Promise<TextResult> {
  const content = await callOpenAI(systemPrompt, userPrompt, 4000)
  return { content }
}

export async function generateJSON<T = unknown>(systemPrompt: string, userPrompt: string): Promise<JSONResult<T>> {
  const raw = await callOpenAI(systemPrompt, userPrompt, 6000)
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
  const data = JSON.parse(cleaned) as T
  return { data }
}

export function isConfigured(): boolean {
  return getKey().length > 10
}

export function getSystemRole(type: ResourceType): string {
  return enricherGetSystemRole(type)
}
