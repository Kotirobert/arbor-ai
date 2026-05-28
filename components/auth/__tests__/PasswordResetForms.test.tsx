import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { ForgotPasswordForm } from '../ForgotPasswordForm'
import { ResetPasswordForm } from '../ResetPasswordForm'
import { SignInForm } from '../SignInForm'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('password reset screens', () => {
  it('links the sign-in form to the forgotten password flow', () => {
    const html = renderToStaticMarkup(<SignInForm />)

    expect(html).toContain('href="/forgot-password"')
    expect(html).not.toContain('href="#"')
  })

  it('renders a public forgotten password request form', () => {
    const html = renderToStaticMarkup(<ForgotPasswordForm />)

    expect(html).toContain('Reset your password')
    expect(html).toContain('type="email"')
    expect(html).toContain('Back to sign in')
  })

  it('renders a password update form for recovery links', () => {
    const html = renderToStaticMarkup(<ResetPasswordForm />)

    expect(html).toContain('Choose a new password')
    expect(html).toContain('autoComplete="new-password"')
    expect(html).toContain('Update password')
  })
})
