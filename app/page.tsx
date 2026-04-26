import { MarketingNav } from '@/components/marketing/MarketingNav'
import { Hero } from '@/components/marketing/Hero'
import { FeatureGrid } from '@/components/marketing/FeatureGrid'
import { HowItWorks } from '@/components/marketing/HowItWorks'
import { PricingTeaser } from '@/components/marketing/PricingTeaser'
import { Footer } from '@/components/marketing/Footer'
import { AuroraBackground } from '@/components/ui/aurora-background'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div>
      <MarketingNav />
      <AuroraBackground className="h-auto min-h-0 justify-start bg-paper dark:bg-zinc-900" showRadialGradient={false}>
        <main className="w-full">
          <Hero />
          <FeatureGrid />
          <HowItWorks />

          {/* Quote band */}
          <section style={{ padding: '120px 0', borderTop: '1px solid var(--line)', background: 'var(--paper-2)' }}>
            <div className="container-narrow">
              <div className="eyebrow" style={{ marginBottom: 24 }}>From a Headteacher</div>
              <p style={{
                fontFamily: 'var(--f-display)',
                fontSize: 'clamp(32px, 4vw, 52px)',
                lineHeight: 1.15,
                letterSpacing: '-0.015em',
                maxWidth: '22ch',
                margin: 0,
              }}>
                &ldquo;Our Year Leads find the pupils who need help in Arbor AI on Monday,
                and our teachers have <i style={{ color: 'var(--chalk-green)' }}>differentiated worksheets for them</i> by Wednesday.&rdquo;
              </p>
              <div style={{ marginTop: 36, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', background: 'var(--amber)',
                  color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--f-ui)', fontSize: 13, fontWeight: 700, flexShrink: 0
                }}>MH</div>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 15 }}>Margaret Hartley</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>Headteacher · Hillcrest Primary, Bristol</div>
                </div>
              </div>
            </div>
          </section>

          <PricingTeaser />
        </main>
      </AuroraBackground>
      <Footer />
    </div>
  )
}
