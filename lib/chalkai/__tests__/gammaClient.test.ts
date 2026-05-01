import { describe, expect, it, vi } from 'vitest'
import { generateGammaPresentation, type SlideContent } from '../gammaClient'

const deck: SlideContent = {
  topic: 'The Water Cycle',
  yearGroup: 'Year 5',
  themeDirection: 'bright science classroom',
  slideCount: 3,
  slides: [
    {
      type: 'title',
      title: 'The Water Cycle',
      subtitle: 'How water moves around our planet',
      speakerNotes: 'Introduce the lesson focus.',
      imageDescription: 'A colourful water cycle diagram',
    },
    {
      type: 'content',
      title: 'Evaporation',
      bullets: ['The Sun heats water', 'Liquid water becomes vapour'],
      speakerNotes: 'Connect to prior learning about states of matter.',
      imageDescription: 'Sun warming a lake with vapour rising',
    },
    {
      type: 'closing',
      title: 'Exit question',
      bullets: ['Which stage comes after evaporation?'],
      speakerNotes: 'Use mini whiteboards.',
      imageDescription: null,
    },
  ],
}

function createFetch(responses: Response[]) {
  const fetcher = vi.fn()
  for (const response of responses) {
    fetcher.mockResolvedValueOnce(response)
  }
  return fetcher
}

describe('generateGammaPresentation', () => {
  it('sends fixed slide content to Gamma in preserve mode', async () => {
    const fetcher = createFetch([
      Response.json({ generationId: 'gen-123' }),
      Response.json({ generationId: 'gen-123', status: 'completed', gammaUrl: 'https://gamma.app/docs/abc', exportUrl: 'https://gamma.app/export/abc.pptx' }),
      new Response(new Uint8Array([1, 2, 3])),
    ])

    await generateGammaPresentation(deck, {
      apiKey: 'gamma-key',
      fetcher,
      pollIntervalMs: 0,
      maxPolls: 1,
    })

    const createBody = JSON.parse(fetcher.mock.calls[0][1].body as string)
    expect(fetcher.mock.calls[0][0]).toBe('https://public-api.gamma.app/v1.0/generations')
    expect(fetcher.mock.calls[0][1].headers).toMatchObject({
      'Content-Type': 'application/json',
      'X-API-KEY': 'gamma-key',
    })
    expect(createBody).toMatchObject({
      textMode: 'preserve',
      format: 'presentation',
      exportAs: 'pptx',
      cardSplit: 'inputTextBreaks',
      numCards: 3,
      imageOptions: {
        source: 'aiGenerated',
      },
      cardOptions: {
        dimensions: '16x9',
      },
    })
    expect(createBody.inputText).toContain('# The Water Cycle')
    expect(createBody.inputText).toContain('- The Sun heats water')
    expect(createBody.inputText).toContain('---')
    expect(createBody.additionalInstructions).toContain('Preserve the provided slide titles')
    expect(createBody.additionalInstructions).toContain('Do not rewrite')
    expect(createBody.additionalInstructions).toContain('Sun warming a lake')
  })

  it('downloads Gamma pptx export as base64', async () => {
    const fetcher = createFetch([
      Response.json({ generationId: 'gen-123' }),
      Response.json({ generationId: 'gen-123', status: 'completed', gammaUrl: 'https://gamma.app/docs/abc', exportUrl: 'https://gamma.app/export/abc.pptx' }),
      new Response(new Uint8Array([1, 2, 3])),
    ])

    const result = await generateGammaPresentation(deck, {
      apiKey: 'gamma-key',
      fetcher,
      pollIntervalMs: 0,
      maxPolls: 1,
    })

    expect(fetcher.mock.calls[1][0]).toBe('https://public-api.gamma.app/v1.0/generations/gen-123')
    expect(fetcher.mock.calls[2][0]).toBe('https://gamma.app/export/abc.pptx')
    expect(result).toEqual({
      base64: 'AQID',
      gammaUrl: 'https://gamma.app/docs/abc',
      exportUrl: 'https://gamma.app/export/abc.pptx',
    })
  })

  it('falls back to local pptx generation when Gamma is not configured', async () => {
    const result = await generateGammaPresentation(deck, {
      apiKey: '',
      fetcher: vi.fn(),
      pollIntervalMs: 0,
      maxPolls: 1,
    })

    expect(result.base64.length).toBeGreaterThan(100)
    expect(result.gammaUrl).toBeUndefined()
  })
})
