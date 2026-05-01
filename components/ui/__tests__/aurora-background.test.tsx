import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { AuroraBackground } from '../aurora-background'

describe('AuroraBackground', () => {
  it('does not let the decorative overlay intercept CTA clicks', () => {
    const html = renderToStaticMarkup(
      <AuroraBackground>
        <a href="/sign-up">Start free</a>
      </AuroraBackground>,
    )

    expect(html).toContain('absolute inset-0 overflow-hidden pointer-events-none')
    expect(html).toContain('href="/sign-up"')
  })
})
