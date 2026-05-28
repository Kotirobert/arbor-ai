'use client'

import Link from 'next/link'
import { useState } from 'react'

import { requestPasswordReset } from '@/lib/auth/supabaseAuth'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSent(false)

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Enter your email address to reset your password.')
      return
    }

    setSubmitting(true)
    const result = await requestPasswordReset(trimmedEmail, window.location.origin)
    setSubmitting(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setSent(true)
  }

  return (
    <main className="auth__main" style={{ minHeight: '100vh' }}>
      <div className="auth__form">
        <div style={{ marginBottom: 32 }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>Account recovery</div>
          <h1 className="h1" style={{ fontSize: 42 }}>Reset your password</h1>
          <p className="muted" style={{ fontSize: 15, marginTop: 10 }}>
            Enter your work email and we will send you a secure reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="field__label" htmlFor="reset-email">Work email</label>
            <input
              className="input"
              id="reset-email"
              type="email"
              placeholder="you@school.org.uk"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          {error && <p style={{ fontSize: 13, color: 'var(--red)', marginTop: 8 }}>{error}</p>}
          {sent && (
            <p style={{ fontSize: 13, color: 'var(--chalk-green)', marginTop: 8 }}>
              Check your email for a password reset link.
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn btn--primary btn--lg btn--block" style={{ marginTop: 24 }}>
            {submitting ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <Link href="/sign-in" className="btn btn--ghost btn--block" style={{ marginTop: 16 }}>
          Back to sign in
        </Link>
      </div>
    </main>
  )
}
