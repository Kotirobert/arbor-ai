import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { ArborSidebar } from '../ArborSidebar'

vi.mock('next/navigation', () => ({
  usePathname: () => '/arbor/dashboard',
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

describe('ArborSidebar', () => {
  it('shows a standalone mobile open-menu button when no parent controller is provided', () => {
    const html = renderToStaticMarkup(<ArborSidebar role="slt" open editMode={false} />)

    expect(html).toContain('aria-label="Open menu"')
  })
})
