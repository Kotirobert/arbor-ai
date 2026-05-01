import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { ProfileWizard } from '../ProfileWizard'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('ProfileWizard', () => {
  it('offers a visible way back to the homepage before creating an account', () => {
    const html = renderToStaticMarkup(<ProfileWizard />)

    expect(html).toContain('href="/"')
    expect(html).toContain('Back to home')
  })
})
