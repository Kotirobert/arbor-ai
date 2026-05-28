'use client'

import Link from 'next/link'
import { useState } from 'react'

import { updatePassword } from '@/lib/auth/supabaseAuth'

export function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updated, setUpdated] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setUpdated(false)

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    const result = await updatePassword(password)
    setSubmitting(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setUpdated(true)
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <main className="auth__main" style={{ minHeight: '100vh' }}>
      <div className="auth__form">
        <div style={{ marginBottom: 32 }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>Secure reset</div>
          <h1 className="h1" style={{ fontSize: 42 }}>Choose a new password</h1>
          <p className="muted" style={{ fontSize: 15, marginTop: 10 }}>
            Use the link from your email, then set a fresh password for your account.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field" style={{ marginBottom: 16 }}>
            <label className="field__label" htmlFor="new-password">New password</label>
            <input
              className="input"
              id="new-password"
              type="password"
              placeholder="At least 6 characters"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="confirm-password">Confirm password</label>
            <input
              className="input"
              id="confirm-password"
              type="password"
              placeholder="Repeat your new password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </div>

          {error && <p style={{ fontSize: 13, color: 'var(--red)', marginTop: 8 }}>{error}</p>}
          {updated && (
            <p style={{ fontSize: 13, color: 'var(--chalk-green)', marginTop: 8 }}>
              Password updated. You can now sign in.
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn btn--primary btn--lg btn--block" style={{ marginTop: 24 }}>
            {submitting ? 'Updating...' : 'Update password'}
          </button>
        </form>

        <Link href="/sign-in" className="btn btn--ghost btn--block" style={{ marginTop: 16 }}>
          Back to sign in
        </Link>
      </div>
    </main>
  )
}
