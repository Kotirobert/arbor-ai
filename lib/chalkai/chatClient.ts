import type { TeacherProfile } from '@/types'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatHistoryMessage {
  role: 'user' | 'assistant'
  body: string
}

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
): ChatMessage[] {
  const profileBlock = profile ? buildProfileBlock(profile) : ''
  const systemContent = profileBlock ? `${SYSTEM_ROLE}\n\nTeacher profile:\n${profileBlock}` : SYSTEM_ROLE

  return [
    { role: 'system', content: systemContent },
    ...history.map((message) => ({ role: message.role, content: message.body })),
    { role: 'user', content: newMessage },
  ]
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
