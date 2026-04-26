import pptxgen from 'pptxgenjs'
import type { ThemedDeck } from './gemmaClient'

export async function buildPptx(deck: ThemedDeck): Promise<string> {
  const pptx = new pptxgen()

  const [bg, , accent, text] = deck.theme.palette
  pptx.theme = { headFontFace: deck.theme.accentFont, bodyFontFace: deck.theme.primaryFont }

  for (const slide of deck.slides) {
    const s = pptx.addSlide()

    s.background = { color: bg.replace('#', '') }

    if (slide.type === 'title') {
      s.addText(slide.title, {
        x: 0.5, y: 2.0, w: '90%', h: 1.2,
        fontSize: 36, bold: true, color: text.replace('#', ''),
        fontFace: deck.theme.accentFont, align: 'center',
      })
      if (slide.subtitle) {
        s.addText(slide.subtitle, {
          x: 0.5, y: 3.4, w: '90%', h: 0.6,
          fontSize: 18, color: accent.replace('#', ''),
          fontFace: deck.theme.primaryFont, align: 'center',
        })
      }
    } else if (slide.type === 'closing') {
      s.addText(slide.title, {
        x: 0.5, y: 2.4, w: '90%', h: 1.0,
        fontSize: 32, bold: true, color: accent.replace('#', ''),
        fontFace: deck.theme.accentFont, align: 'center',
      })
    } else if (slide.type === 'image' && slide.imageBase64) {
      s.addImage({
        data: `image/png;base64,${slide.imageBase64}`,
        x: 0, y: 0, w: '100%', h: '100%',
      })
      s.addText(slide.title, {
        x: 0.3, y: 0.2, w: '94%', h: 0.7,
        fontSize: 22, bold: true, color: text.replace('#', ''),
        fontFace: deck.theme.accentFont,
        shadow: { type: 'outer', color: '000000', blur: 4, offset: 2, angle: 45 },
      })
    } else {
      // content slide (or image slide without imageBase64)
      s.addText(slide.title, {
        x: 0.4, y: 0.3, w: '92%', h: 0.7,
        fontSize: 24, bold: true, color: accent.replace('#', ''),
        fontFace: deck.theme.accentFont,
      })

      const contentWidth = slide.imageBase64 ? '55%' : '92%'

      if (slide.bullets && slide.bullets.length > 0) {
        const bulletText = slide.bullets.slice(0, 5).map((b) => ({
          text: b,
          options: { bullet: { type: 'bullet' as const }, fontSize: 16, color: text.replace('#', ''), paraSpaceAfter: 8 },
        }))
        s.addText(bulletText, {
          x: 0.4, y: 1.2, w: contentWidth, h: 4.0,
          fontFace: deck.theme.primaryFont, valign: 'top',
        })
      }

      if (slide.imageBase64) {
        s.addImage({
          data: `image/png;base64,${slide.imageBase64}`,
          x: '60%', y: 1.2, w: '36%', h: 3.6,
        })
      }
    }

    if (slide.speakerNotes) {
      s.addNotes(slide.speakerNotes)
    }
  }

  const base64 = await pptx.write({ outputType: 'base64' })
  return base64 as string
}
