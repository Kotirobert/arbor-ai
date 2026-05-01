import type { TeacherProfile } from '@/types'
import type { MemoryPromptSummary } from './memoryStore'
import { scanForPII } from './piiScanner'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatHistoryMessage {
  role: 'user' | 'assistant'
  body: string
}

export const CHAT_MEMORY_BUDGET = 1200

const SYSTEM_ROLE = `You are ChalkAI, an expert teaching assistant for UK school teachers.
You help teachers create resources, plan lessons, and answer pedagogy questions.
Write in British English. Be concise, practical, and teacher-friendly.
When asked to generate a resource, produce the full resource directly in your reply, formatted clearly with Markdown headings and bullet points.
Never include or request personally identifiable pupil data.`

function buildProfileBlock(profile: TeacherProfile): string {
  return [
    profile.yearGroups?.length ? `Year groups: ${profile.yearGroups.join(', ')}` : '',
    profile.curriculum ? `Curriculum: ${profile.curriculum}` : '',
    profile.phase ? `Phase: ${profile.phase}` : '',
    profile.subjects?.length ? `Subjects: ${profile.subjects.join(', ')}` : '',
    profile.classProfile?.length ? `Class profile: ${profile.classProfile.join(', ')}` : '',
    profile.lessonLength ? `Typical lesson length: ${profile.lessonLength}` : '',
    profile.outputStyle ? `Preferred output style: ${profile.outputStyle}` : '',
  ].filter(Boolean).join('\n')
}

export function buildChatMessages(
  history: ChatHistoryMessage[],
  newMessage: string,
  profile?: TeacherProfile | null,
  memory?: MemoryPromptSummary | null,
): ChatMessage[] {
  const profileBlock = profile ? buildProfileBlock(profile) : ''
  const memoryBlock = buildMemoryBlock(memory)
  const contextBlocks = [
    profileBlock ? `Teacher profile:\n${profileBlock}` : '',
    memoryBlock ? `Teacher memory:\n${memoryBlock}` : '',
  ].filter(Boolean)
  const systemContent = contextBlocks.length ? `${SYSTEM_ROLE}\n\n${contextBlocks.join('\n\n')}` : SYSTEM_ROLE

  return [
    { role: 'system', content: systemContent },
    ...history.map((message) => ({ role: message.role, content: message.body })),
    { role: 'user', content: newMessage },
  ]
}

function buildMemoryBlock(memory?: MemoryPromptSummary | null): string {
  const text = memory?.text.trim()
  if (!text) return ''
  const pii = scanForPII(text)
  if (pii.blocked) return ''
  const safeText = pii.sanitised.trim()
  return safeText.length > CHAT_MEMORY_BUDGET ? `${safeText.slice(0, CHAT_MEMORY_BUDGET - 1)}…` : safeText
}

export async function postChat(
  history: ChatHistoryMessage[],
  newMessage: string,
  profile?: TeacherProfile | null,
): Promise<string> {
  const response = await fetch('/api/chalkai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ history, message: newMessage, profile }),
  })

  if (!response.ok) {
    throw new Error('Chat request failed')
  }

  const body = await response.json() as { reply?: string }
  return body.reply ?? ''
}
