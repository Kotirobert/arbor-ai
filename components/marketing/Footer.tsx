import Link from 'next/link'
import type { Route } from 'next'

export function Footer() {
  return (
    <footer style={{ padding: '64px 0 48px', borderTop: '1px solid var(--line)', color: 'var(--ink-2)', fontSize: 13 }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 }}>
          <div>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 26, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--ink)', display: 'inline-block', position: 'relative', flexShrink: 0 }} />
              ChalkAI
            </div>
            <p style={{ maxWidth: '34ch', margin: 0 }}>
              Built in Bristol for UK primary and secondary schools.
              GDPR-ready. Data stays in your browser until you save it.
            </p>
          </div>

          <div>
            <h4 style={{ fontFamily: 'var(--f-ui)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink)', margin: '0 0 14px' }}>Product</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li><Link href={"/chalkai" as Route}>ChalkAI assistant</Link></li>
              <li><Link href="/arbor/dashboard">Arbor AI</Link></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><Link href="/sign-up">Sign up</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontFamily: 'var(--f-ui)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink)', margin: '0 0 14px' }}>Company</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li><a>About</a></li>
              <li><a>Careers</a></li>
              <li><a>Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontFamily: 'var(--f-ui)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink)', margin: '0 0 14px' }}>Legal</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li><a>Privacy</a></li>
              <li><a>Terms</a></li>
              <li><a>DPA</a></li>
              <li><a>Safeguarding</a></li>
            </ul>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 24, borderTop: '1px solid var(--line)', fontSize: 12, color: 'var(--ink-3)' }}>
          <span>© 2026 ChalkAI Ltd.</span>
          <span>Made with care · Bristol, UK</span>
        </div>
      </div>
    </footer>
  )
}
