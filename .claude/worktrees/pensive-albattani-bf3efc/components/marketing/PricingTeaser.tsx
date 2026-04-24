import Link from 'next/link'

const PLANS = [
  {
    name: 'Free',
    blurb: 'Try before you commit',
    amount: '0',
    per: 'forever · 1 teacher',
    features: [
      '5 resource generations / month',
      '1 Arbor upload · no AI summaries',
      'Teacher profile + library',
      'Email support',
    ],
    cta: 'Start free',
    href: '/sign-up',
    featured: false,
  },
  {
    name: 'Pro',
    blurb: 'For the teacher who wants everything',
    amount: '9',
    per: 'per teacher · per month',
    features: [
      'Unlimited ChalkAI generations + exports',
      'Unlimited Arbor uploads + AI summaries',
      'Natural-language school queries',
      'PDF + Word export',
      'Priority support',
    ],
    cta: 'Start 14-day trial',
    href: '/sign-up',
    featured: true,
  },
  {
    name: 'School',
    blurb: 'For the whole staffroom',
    amount: '6',
    per: 'per teacher · per month · min 5',
    features: [
      'Everything in Pro',
      'Shared resource library',
      'Admin dashboard + audit log',
      'Multi-role: SLT, HOY, Teacher',
      'Dedicated onboarding',
    ],
    cta: 'Talk to us',
    href: '/sign-up',
    featured: false,
  },
]

export function PricingTeaser() {
  return (
    <section id="pricing" style={{ padding: '120px 0', borderTop: '1px solid var(--line)' }}>
      <div className="container">
        <div className="eyebrow" style={{ marginBottom: 16 }}>Pricing</div>
        <h2 className="h1" style={{ maxWidth: '20ch' }}>
          Free for one teacher.<br />
          <i style={{ color: 'var(--chalk-green)' }}>Simple for a whole school.</i>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-14">
          {PLANS.map((plan) => (
            <div key={plan.name} style={{
              border: `1px solid ${plan.featured ? 'var(--ink)' : 'var(--line)'}`,
              borderRadius: 'var(--radius-xl)',
              padding: 32,
              display: 'flex',
              flexDirection: 'column',
              background: plan.featured ? 'var(--ink)' : 'var(--paper)',
              color: plan.featured ? 'var(--paper)' : 'var(--ink)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 28, margin: 0, fontWeight: 400 }}>{plan.name}</h3>
                {plan.featured && (
                  <span className="tag" style={{ background: 'var(--amber)', color: 'var(--ink)', border: 0 }}>Most popular</span>
                )}
              </div>
              <p style={{ fontSize: 13, color: plan.featured ? 'var(--ink-3)' : 'var(--ink-2)', marginBottom: 24 }}>{plan.blurb}</p>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: 48, lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 4 }}>
                <sup style={{ fontSize: 18, fontFamily: 'var(--f-body)', fontWeight: 500, verticalAlign: 'super', marginRight: 4 }}>£</sup>
                {plan.amount}
              </div>
              <div style={{ fontSize: 13, color: plan.featured ? 'rgba(250,250,247,0.7)' : 'var(--ink-2)', marginBottom: 28 }}>{plan.per}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                    <span style={{ color: plan.featured ? 'var(--amber)' : 'var(--chalk-green)', fontFamily: 'var(--f-mono)', fontWeight: 500, flexShrink: 0 }}>+</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={plan.href as any} className="btn" style={{
                marginTop: 'auto',
                background: plan.featured ? 'var(--amber)' : 'transparent',
                color: plan.featured ? 'var(--ink)' : 'var(--ink)',
                border: plan.featured ? '0' : '1px solid var(--line-2)',
                width: '100%',
                justifyContent: 'center',
              }}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
