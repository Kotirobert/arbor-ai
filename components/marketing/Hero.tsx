import Link from 'next/link'

export function Hero() {
  return (
    <section className="hero" style={{ padding: 'clamp(48px, 8vw, 96px) 0 clamp(64px, 10vw, 120px)' }}>
      <div className="container">
        <span className="hero__badge" style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: '7px 14px 7px 8px', border: '1px solid var(--line-2)',
          borderRadius: 100, fontSize: 13, color: 'var(--ink-2)',
          marginBottom: 36, background: 'var(--paper)'
        }}>
          <span style={{
            background: 'var(--ink)', color: 'var(--paper)',
            fontSize: 11, padding: '3px 9px', borderRadius: 100,
            fontFamily: 'var(--f-ui)', fontWeight: 700, letterSpacing: '0.04em'
          }}>New</span>
          Arbor AI pastoral insights are now part of ChalkAI
        </span>

        <h1 className="display" style={{ color: 'var(--ink)' }}>
          Teaching tools<br />
          and school data,<br />
          <i style={{ color: 'var(--chalk-green)' }}>one login.</i>
        </h1>

        <p className="lead" style={{ margin: '28px 0 36px' }}>
          ChalkAI helps UK schools plan better lessons and spot pupils who need support —
          in a single, calm workspace built for teachers and leaders.
        </p>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <Link href="/sign-up" className="btn btn--primary btn--lg">
            Start free — no card
            <svg className="ico" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </Link>
          <a href="#tools" className="btn btn--ghost btn--lg">See how it works</a>
        </div>

        <div style={{
          marginTop: 72, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', borderTop: '1px solid var(--line)',
          paddingTop: 28, flexWrap: 'wrap', gap: 16
        }}>
          <span className="eyebrow">Trusted by staff at</span>
          <div style={{
            display: 'flex', gap: 'clamp(16px, 4vw, 40px)', flexWrap: 'wrap',
            fontFamily: 'var(--f-display)', fontSize: 'clamp(15px, 2vw, 20px)',
            color: 'var(--ink-2)', fontStyle: 'italic',
          }}>
            <span>Hillcrest Primary</span>
            <span>St. Edmund&rsquo;s</span>
            <span>Ashfield Academy</span>
            <span>Meadowbrook C of E</span>
          </div>
        </div>
      </div>
    </section>
  )
}
