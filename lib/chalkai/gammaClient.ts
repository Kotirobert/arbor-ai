import { Buffer } from 'node:buffer'

import { buildPptx } from './pptxBuilder'

export interface SlideContent {
  topic: string
  yearGroup: string
  themeDirection: string
  slideCount: number
  slides: Array<{
    type: 'title' | 'content' | 'image' | 'closing'
    title: string
    subtitle?: string
    bullets?: string[]
    speakerNotes: string
    imageDescription: string | null
  }>
}

export interface ThemedDeck {
  theme: {
    palette: string[]
    primaryFont: string
    accentFont: string
    backgroundStyle: 'solid' | 'gradient' | 'textured'
  }
  slides: Array<SlideContent['slides'][number] & { imageBase64?: string }>
}

interface GammaGenerationOptions {
  apiKey?: string
  fetcher?: typeof fetch
  pollIntervalMs?: number
  maxPolls?: number
}

interface GammaGenerationResult {
  base64: string
  gammaUrl?: string
  exportUrl?: string
}

interface GammaCreateResponse {
  generationId?: string
  warnings?: string
}

interface GammaStatusResponse {
  status?: 'pending' | 'completed' | 'failed'
  gammaUrl?: string
  exportUrl?: string
  error?: { message?: string; statusCode?: number }
}

const GAMMA_BASE_URL = 'https://public-api.gamma.app/v1.0'
const DEFAULT_POLL_INTERVAL_MS = 5000
const DEFAULT_MAX_POLLS = 36

export async function generateGammaPresentation(
  slideContent: SlideContent,
  options: GammaGenerationOptions = {},
): Promise<GammaGenerationResult> {
  const apiKey = options.apiKey ?? process.env.GAMMA_API_KEY ?? ''
  if (!apiKey) {
    return { base64: await buildPptx(mockTheme(slideContent)) }
  }

  const fetcher = options.fetcher ?? fetch
  const createResponse = await fetcher(`${GAMMA_BASE_URL}/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
    },
    body: JSON.stringify(buildGammaRequest(slideContent)),
  })

  if (!createResponse.ok) {
    throw new Error(`Gamma ${createResponse.status}: ${await readGammaError(createResponse)}`)
  }

  const createBody = await createResponse.json() as GammaCreateResponse
  if (!createBody.generationId) {
    throw new Error('Gamma did not return a generationId')
  }

  const status = await pollGeneration(createBody.generationId, {
    apiKey,
    fetcher,
    pollIntervalMs: options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS,
    maxPolls: options.maxPolls ?? DEFAULT_MAX_POLLS,
  })

  if (!status.exportUrl) {
    throw new Error('Gamma completed without a PPTX export URL')
  }

  const exportResponse = await fetcher(status.exportUrl)
  if (!exportResponse.ok) {
    throw new Error(`Gamma export ${exportResponse.status}: ${await readGammaError(exportResponse)}`)
  }

  const bytes = Buffer.from(await exportResponse.arrayBuffer())
  return {
    base64: bytes.toString('base64'),
    gammaUrl: status.gammaUrl,
    exportUrl: status.exportUrl,
  }
}

function buildGammaRequest(slideContent: SlideContent): Record<string, unknown> {
  return {
    inputText: formatSlidesForGamma(slideContent),
    additionalInstructions: buildPreserveInstructions(slideContent),
    textMode: 'preserve',
    format: 'presentation',
    numCards: slideContent.slides.length,
    cardSplit: 'inputTextBreaks',
    exportAs: 'pptx',
    imageOptions: {
      source: 'aiGenerated',
      model: process.env.GAMMA_IMAGE_MODEL || undefined,
      style: slideContent.themeDirection || 'clean, classroom-friendly educational illustrations',
    },
    cardOptions: {
      dimensions: '16x9',
    },
  }
}

function formatSlidesForGamma(slideContent: SlideContent): string {
  return slideContent.slides.map((slide) => {
    const lines = [`# ${slide.title.trim()}`]
    if (slide.subtitle?.trim()) lines.push(slide.subtitle.trim())
    for (const bullet of slide.bullets ?? []) {
      if (bullet.trim()) lines.push(`- ${bullet.trim()}`)
    }
    return lines.join('\n')
  }).join('\n\n---\n\n')
}

function buildPreserveInstructions(slideContent: SlideContent): string {
  const imageDirections = slideContent.slides
    .map((slide, index) => slide.imageDescription?.trim()
      ? `Slide ${index + 1} "${slide.title}": ${slide.imageDescription.trim()}`
      : '')
    .filter(Boolean)
    .join('\n')

  return [
    'Preserve the provided slide titles, subtitles, and bullet text exactly.',
    'Do not rewrite, paraphrase, add, remove, merge, or split any visible slide text.',
    'Create exactly one Gamma card for each slide, using the --- separators as card boundaries.',
    'Use the image directions below only to choose relevant pictures or illustrations; do not render the image direction text on any slide.',
    `Theme direction: ${slideContent.themeDirection || 'modern classroom presentation'}.`,
    imageDirections ? `Image directions:\n${imageDirections}` : '',
  ].filter(Boolean).join('\n')
}

async function pollGeneration(
  generationId: string,
  options: Required<Pick<GammaGenerationOptions, 'apiKey' | 'fetcher' | 'pollIntervalMs' | 'maxPolls'>>,
): Promise<GammaStatusResponse> {
  for (let attempt = 0; attempt < options.maxPolls; attempt += 1) {
    if (attempt > 0 && options.pollIntervalMs > 0) {
      await delay(options.pollIntervalMs)
    }

    const response = await options.fetcher(`${GAMMA_BASE_URL}/generations/${encodeURIComponent(generationId)}`, {
      headers: { 'X-API-KEY': options.apiKey },
    })

    if (!response.ok) {
      throw new Error(`Gamma status ${response.status}: ${await readGammaError(response)}`)
    }

    const body = await response.json() as GammaStatusResponse
    if (body.status === 'completed') return body
    if (body.status === 'failed') {
      throw new Error(`Gamma generation failed: ${body.error?.message ?? 'Unknown error'}`)
    }
  }

  throw new Error('Gamma generation timed out')
}

function mockTheme(slideContent: SlideContent): ThemedDeck {
  return {
    theme: {
      palette: ['#0e0f0d', '#1a1a2e', '#e8a32a', '#ffffff', '#b0b0b0'],
      primaryFont: 'DM Sans',
      accentFont: 'Instrument Serif',
      backgroundStyle: 'gradient',
    },
    slides: slideContent.slides.map((slide) => ({ ...slide, imageBase64: undefined })),
  }
}

async function readGammaError(response: Response): Promise<string> {
  const body = await response.json().catch(() => null) as { error?: { message?: string }; message?: string } | null
  return body?.error?.message ?? body?.message ?? 'Unknown error'
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
