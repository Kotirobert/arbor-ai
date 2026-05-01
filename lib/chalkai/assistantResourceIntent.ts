import type { GenerateRequest, ResourceType, TeacherProfile } from '@/types'

type AssistantGeneratableResource = Extract<ResourceType, 'image' | 'presentation'>

interface BuildRequestArgs {
  message: string
  resourceType: AssistantGeneratableResource
  profile: TeacherProfile | null
}

const GENERATE_VERBS = /\b(create|make|generate|build|produce|draft|design|give me|can you|please)\b/i
const IMAGE_WORDS = /\b(image|picture|illustration|visual|diagram|poster)\b/i
const PRESENTATION_WORDS = /\b(slide|slides|slide deck|deck|presentation|powerpoint|pptx)\b/i

export function detectAssistantResourceType(message: string): AssistantGeneratableResource | null {
  const text = message.trim()
  if (!text || !GENERATE_VERBS.test(text)) return null
  if (PRESENTATION_WORDS.test(text)) return 'presentation'
  if (IMAGE_WORDS.test(text)) return 'image'
  return null
}

export function buildAssistantGenerateRequest({
  message,
  resourceType,
  profile,
}: BuildRequestArgs): GenerateRequest {
  const yearGroup = inferYearGroup(message) ?? profile?.yearGroups?.[0] ?? ''

  return {
    resourceType,
    input: message,
    profile: {
      curriculum: profile?.curriculum ?? '',
      yearGroup,
      subjectSpecialism: profile?.subjects?.[0] ?? '',
      classProfile: profile?.classProfile?.join(', ') ?? '',
      lessonLength: profile?.lessonLength ?? '',
      outputStyle: profile?.outputStyle ?? '',
    },
    resourceSpecificFields: resourceType === 'presentation'
      ? buildPresentationFields(message)
      : buildImageFields(message),
  }
}

function inferYearGroup(message: string): string | null {
  const yearMatch = message.match(/\byear\s*([1-6])\b/i)
  if (yearMatch) return `Year ${yearMatch[1]}`
  if (/\breception\b/i.test(message)) return 'Reception'
  return null
}

function buildPresentationFields(message: string): GenerateRequest['resourceSpecificFields'] {
  const slideCount = inferSlideCount(message)

  return {
    slideCount,
    speakerNotes: true,
  }
}

function inferSlideCount(message: string): number {
  const explicit = message.match(/\b(\d{1,2})\s*(?:slide|slides|card|cards)\b/i)
  const count = explicit ? Number(explicit[1]) : 8
  return Math.min(Math.max(count, 3), 20)
}

function buildImageFields(message: string): GenerateRequest['resourceSpecificFields'] {
  return {
    intendedUse: inferImageUse(message),
    orientation: inferOrientation(message),
  }
}

function inferImageUse(message: string): 'poster' | 'diagram' | 'display' | 'scene' {
  if (/\bposter\b/i.test(message)) return 'poster'
  if (/\bdiagram|labelled|labeled|infographic\b/i.test(message)) return 'diagram'
  if (/\bdisplay|wall|board\b/i.test(message)) return 'display'
  return 'scene'
}

function inferOrientation(message: string): 'landscape' | 'portrait' | 'square' {
  if (/\bportrait\b/i.test(message)) return 'portrait'
  if (/\blandscape\b/i.test(message)) return 'landscape'
  if (/\bsquare\b/i.test(message)) return 'square'
  return 'square'
}
