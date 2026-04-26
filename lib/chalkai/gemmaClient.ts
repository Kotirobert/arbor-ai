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

function mockGemmaResponse(slideContent: SlideContent): ThemedDeck {
  return {
    theme: {
      palette: ['#0e0f0d', '#1a1a2e', '#e8a32a', '#ffffff', '#b0b0b0'],
      primaryFont: 'DM Sans',
      accentFont: 'Instrument Serif',
      backgroundStyle: 'gradient',
    },
    slides: slideContent.slides.map((slide) => ({
      ...slide,
      imageBase64: undefined,
    })),
  }
}

export async function themeAndIllustrate(slideContent: SlideContent): Promise<ThemedDeck> {
  const key = process.env.GEMMA_API_KEY
  if (!key) {
    return mockGemmaResponse(slideContent)
  }
  // Real Gemma implementation — add when API key is provided
  throw new Error('Gemma API not yet implemented — provide GEMMA_API_KEY')
}
