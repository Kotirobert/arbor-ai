'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { getLastTool } from '@/lib/auth/mockSession'
import { signInWithPassword } from '@/lib/auth/supabaseAuth'

export function SignInForm() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password.trim()) {
      setError('Enter your email and password to continue.')
      return
    }
    setSubmitting(true)
    const result = await signInWithPassword(trimmedEmail, password)
    if (result.error) {
      setError(result.error)
      setSubmitting(false)
      return
    }

    const target = getLastTool() === 'arbor' ? '/arbor/dashboard' : '/chalkai'
    router.push(target as any)
  }

  return (
    <div className="auth">
      {/* Left aside */}
      <aside className="auth__aside">
        <Link href="/" style={{ fontFamily: 'var(--f-display)', fontSize: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--ink)', position: 'relative', display: 'inline-block' }} />
          ChalkAI
        </Link>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 420, margin: '0 auto' }}>
          <div className="eyebrow" style={{ marginBottom: 24 }}>Teaching tools + school data. One login.</div>
          <div style={{ borderLeft: '2px solid var(--chalk-green)', paddingLeft: 20 }}>
            <p style={{ fontFamily: 'var(--f-display)', fontSize: 32, lineHeight: 1.2, letterSpacing: '-0.01em', margin: '0 0 18px' }}>
              &ldquo;I plan Monday&rsquo;s lesson and check on my Year 6 cohort{' '}
              <i style={{ color: 'var(--chalk-green)' }}>from the same tab.</i>&rdquo;
            </p>
            <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>Mr. J. Okafor · Year 6 Lead · Meadowbrook C of E</div>
          </div>

          <div style={{
            border: '1px solid var(--line)', borderRadius: 10, padding: '14px 16px',
            background: 'var(--paper)', marginTop: 24, display: 'flex', gap: 12, alignItems: 'flex-start'
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8, background: 'var(--chalk-green-soft)',
              color: 'var(--chalk-green)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, border: '1px solid var(--chalk-green-line)'
            }}>
              <svg style={{ width: 16, height: 16, stroke: 'currentColor', strokeWidth: 1.5, fill: 'none' }} viewBox="0 0 24 24">
                <path d="M3 21v-5l9-9 5 5-9 9H3z"/><path d="M12 7l5 5"/>
              </svg>
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
              <strong style={{ color: 'var(--ink)', fontWeight: 500 }}>New to Arbor AI?</strong>{' '}
              Ask your school admin to add you — Heads, Year Leads and Class Teachers are invited, not signed up directly.
            </div>
          </div>
        </div>

        <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>© 2026 ChalkAI Ltd · Bristol, UK</div>
      </aside>

      {/* Right main */}
      <main className="auth__main">
        <div className="auth__form">
          <div style={{ marginBottom: 40 }}>
            <div className="eyebrow" style={{ marginBottom: 16 }}>Welcome back</div>
            <h1 className="h1" style={{ fontSize: 44 }}>Sign in to <i>ChalkAI</i>.</h1>
            <p className="muted" style={{ fontSize: 15, marginTop: 10 }}>One login. Both tools.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="field" style={{ marginBottom: 16 }}>
              <label className="field__label" htmlFor="email">Work email</label>
              <input
                className="input"
                id="email"
                type="email"
                placeholder="you@school.org.uk"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="field__label" htmlFor="pw">Password</label>
                <a href="#" style={{ fontSize: 12, color: 'var(--ink-2)', textDecoration: 'underline' }}>Forgot?</a>
              </div>
              <input
                className="input"
                id="pw"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p style={{ fontSize: 13, color: 'var(--red)', marginTop: 8 }}>{error}</p>}

            <button type="submit" disabled={submitting} className="btn btn--primary btn--lg btn--block" style={{ marginTop: 24 }}>
              {submitting ? 'Signing in…' : 'Sign in'}
              <svg className="ico" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--ink-3)', margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
            or
            <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          </div>

          <Link href="/sign-up" className="btn btn--ghost btn--block">
            Create a ChalkAI account
          </Link>

          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink-3)', marginTop: 32 }}>
            No SSO. Just email + password. By design.
          </p>
        </div>
      </main>
    </div>
  )
}
