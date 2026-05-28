import type { GenerateRequest, ResourceType } from '@/types'
import { buildTemplate as lessonPlan } from './templates/lessonPlan'
import { buildTemplate as worksheet } from './templates/worksheet'
import { buildTemplate as quiz } from './templates/quiz'
import { buildTemplate as parentLetter } from './templates/parentLetter'
import { buildTemplate as presentation } from './templates/presentation'
import type { MemoryPromptSummary } from './memoryStore'
import { scanForPII } from './piiScanner'

const SYSTEM_ROLES: Record<ResourceType, string> = {
  lesson_plan:  'You are an expert teaching assistant specialising in lesson design.',
  worksheet:    'You are an expert teaching assistant specialising in differentiated classroom resources.',
  quiz:         'You are an expert teaching assistant specialising in formative assessment.',
  parent_email: 'You are an expert teaching assistant specialising in school–home communication.',
  image:        'You are a creative illustrator producing educational images for classroom use.',
  presentation: 'You are an expert teaching assistant specialising in classroom presentations. You output only valid JSON.',
}

const MEMORY_BUDGET = 1200

function templateFor(type: ResourceType): string {
  switch (type) {
    case 'lesson_plan':  return lessonPlan()
    case 'worksheet':    return worksheet()
    case 'quiz':         return quiz()
    case 'parent_email': return parentLetter()
    case 'presentation': return presentation()
    case 'image':        return ''
  }
}

export function buildEnrichedPrompt(req: GenerateRequest, memory?: MemoryPromptSummary | null): string {
  const { resourceType, input, profile, resourceSpecificFields = {} } = req

  const contextLines: string[] = [
    `Year group: ${profile.yearGroup}`,
  ]
  if (profile.curriculum)        contextLines.push(`Curriculum: ${profile.curriculum}`)
  if (profile.subjectSpecialism) contextLines.push(`Subject specialism: ${profile.subjectSpecialism}`)
  if (profile.classProfile)      contextLines.push(`Class profile: ${profile.classProfile}`)
  if (profile.lessonLength)      contextLines.push(`Lesson length: ${profile.lessonLength}`)
  if (profile.outputStyle)       contextLines.push(`Preferred style: ${profile.outputStyle}`)

  const extraLines: string[] = []
  for (const [key, value] of Object.entries(resourceSpecificFields)) {
    if (value !== '' && value !== undefined && value !== null) {
      extraLines.push(`${key}: ${value}`)
    }
  }

  const parts = [
    `[SYSTEM ROLE]\n${SYSTEM_ROLES[resourceType]}`,
  ]

  const template = templateFor(resourceType)
  if (template) {
    parts.push(`[RESOURCE TEMPLATE]\n${template}`)
  }

  const memoryBlock = buildMemoryBlock(memory)
  if (memoryBlock) {
    parts.push(`[TEACHER MEMORY]\n${memoryBlock}`)
  }

  parts.push(
    `[TEACHER REQUEST + CONTEXT]\n${contextLines.join('\n')}${extraLines.length ? '\n' + extraLines.join('\n') : ''}\n\nTeacher's request: ${input}`
  )

  return parts.join('\n\n')
}

export function getSystemRole(type: ResourceType): string {
  return SYSTEM_ROLES[type]
}

function buildMemoryBlock(memory?: MemoryPromptSummary | null): string {
  const text = memory?.text.trim()
  if (!text) return ''

  const pii = scanForPII(text)
  if (pii.blocked) return ''

  return pii.sanitised.length > MEMORY_BUDGET
    ? `${pii.sanitised.slice(0, MEMORY_BUDGET - 1)}…`
    : pii.sanitised
}
