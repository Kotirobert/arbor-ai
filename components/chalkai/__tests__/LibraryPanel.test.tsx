import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LibraryPanel } from '../LibraryPanel'

describe('LibraryPanel', () => {
  it('points empty libraries back to the generator', () => {
    const html = renderToStaticMarkup(<LibraryPanel />)

    expect(html).toContain('No saved resources yet')
    expect(html).toContain('href="/chalkai?mode=generator"')
    expect(html).toContain('Create a resource')
  })
})
