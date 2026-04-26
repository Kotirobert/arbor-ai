import type { GenerateRequest, GenerateResponse } from '@/types'
import { generateText, generateJSON, getSystemRole } from './openaiClient'
import { generateImage } from './openaiImageClient'
import { themeAndIllustrate, type SlideContent } from './gemmaClient'
import { buildPptx } from './pptxBuilder'
import { buildImagePrompt } from './templates/image'

export async function routeToModel(
  enrichedPrompt: string,
  req: GenerateRequest,
): Promise<Omit<GenerateResponse, 'piiFindings'>> {
  const { resourceType, input, profile, resourceSpecificFields = {} } = req

  switch (resourceType) {
    case 'lesson_plan':
    case 'worksheet':
    case 'quiz':
    case 'parent_email': {
      const systemRole = getSystemRole(resourceType)
      const { content } = await generateText(systemRole, enrichedPrompt)
      return { type: 'text', output: content, piiFindings: [] }
    }

    case 'image': {
      const intendedUse = (resourceSpecificFields.intendedUse as string) ?? 'scene'
      const orientation = (resourceSpecificFields.orientation as 'landscape' | 'portrait' | 'square') ?? 'square'
      const imagePrompt = buildImagePrompt(input, profile.yearGroup, intendedUse, orientation)
      const { base64 } = await generateImage(imagePrompt, orientation)
      return { type: 'image', output: base64, mimeType: 'image/png' }
    }

    case 'presentation': {
      const systemRole = getSystemRole('presentation')
      const { data } = await generateJSON<SlideContent>(systemRole, enrichedPrompt)
      const themedDeck = await themeAndIllustrate(data)
      const base64 = await buildPptx(themedDeck)
      const filename = `${data.topic.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-presentation.pptx`
      return { type: 'pptx', output: base64, filename }
    }
  }
}
