import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { UserMenu } from '../UserMenu'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('UserMenu', () => {
  it('renders user identity, settings link, and an accessible sign-out button', () => {
    const html = renderToStaticMarkup(
      <UserMenu initials="AL" displayName="Ada Lovelace" subtitle="Year 4" />,
    )

    expect(html).toContain('Ada Lovelace')
    expect(html).toContain('Year 4')
    expect(html).toContain('href="/settings"')
    expect(html).toContain('aria-label="Open settings"')
    expect(html).toContain('aria-label="Sign out"')
  })
})
