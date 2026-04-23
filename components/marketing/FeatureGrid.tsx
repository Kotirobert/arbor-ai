import Link from 'next/link'
import type { Route } from 'next'

export function FeatureGrid() {
  return (
    <section id="tools" style={{ padding: '120px 0 40px' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 16 }}>Two tools, one subscription</div>
            <h2 className="h1">One workspace.<br /><i style={{ color: 'var(--chalk-green)' }}>Two instruments.</i></h2>
          </div>
          <p className="muted" style={{ maxWidth: '38ch', fontSize: 15 }}>
            The same teachers using ChalkAI to plan Friday&rsquo;s lesson are the ones
            asking Arbor AI which pupils need a check-in that morning.
          </p>
        </div>

        <div style={{ marginTop: 56, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* ChalkAI card */}
          <div style={{
            border: '1px solid var(--line)', borderRadius: 'var(--radius-xl)',
            padding: 40, background: 'linear-gradient(180deg, #FAFAF7 0%, #F4F3EE 100%)',
            display: 'flex', flexDirection: 'column', minHeight: 520, position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ink)' }} />
              <span style={{ fontFamily: 'var(--f-ui)', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>ChalkAI</span>
              <span className="tag" style={{ marginLeft: 'auto' }}>for teachers</span>
            </div>
            <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 44, lineHeight: 1, letterSpacing: '-0.02em', margin: '0 0 10px' }}>
              The teaching <i>assistant</i>.
            </h3>
            <p style={{ fontFamily: 'var(--f-body)', fontSize: 13, color: 'var(--ink-2)', marginBottom: 20 }}>
              Lesson plans, worksheets, quizzes, parent emails.
            </p>
            <p style={{ fontSize: 17, color: 'var(--ink)', margin: '0 0 24px', lineHeight: 1.5, maxWidth: '42ch' }}>
              A conversational AI that already knows your year groups, curriculum and class profile —
              so you never re-type context.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14.5, color: 'var(--ink-2)' }}>
              {[
                'Generate a full lesson plan in 40 seconds',
                'Refine with one click: /bloom · /differentiate · /exit-ticket',
                'Rosenshine, retrieval practice, SEND adaptations baked in',
                'Save to your library — never lose a good worksheet again',
              ].map((item) => (
                <li key={item} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--ink-3)', flexShrink: 0, transform: 'translateY(-2px)' }} />
                  {item}
                </li>
              ))}
            </ul>

            <div style={{ marginTop: 'auto', border: '1px solid var(--line)', borderRadius: 10, background: 'var(--paper)', padding: 16, fontFamily: 'var(--f-mono)', fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.6 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--ink)' }}>
                <span style={{ fontFamily: 'var(--f-ui)', fontSize: 10, background: 'var(--paper-3)', padding: '2px 6px', borderRadius: 3, color: 'var(--ink-3)', fontWeight: 700 }}>YOU</span>
                <span>Year 7 fractions — mixed ability, 60 min</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                <span style={{ fontFamily: 'var(--f-ui)', fontSize: 10, background: 'var(--amber-soft)', padding: '2px 6px', borderRadius: 3, color: 'var(--amber)', fontWeight: 700 }}>CHALKAI</span>
                <span style={{ color: 'var(--ink)' }}>Drafting lesson plan with three-tier differentiation…</span>
              </div>
            </div>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
              <Link href={"/chalkai" as Route} className="btn btn--ghost">
                Open assistant
                <svg className="ico" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </Link>
            </div>
          </div>

          {/* Arbor AI card */}
          <div style={{
            border: '1px solid var(--chalk-green-line)', borderRadius: 'var(--radius-xl)',
            padding: 40, background: 'linear-gradient(180deg, #F2F7F3 0%, #E8F0EA 100%)',
            display: 'flex', flexDirection: 'column', minHeight: 520, position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--chalk-green)' }} />
              <span style={{ fontFamily: 'var(--f-ui)', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--chalk-green)' }}>Arbor AI</span>
              <span className="tag tag--green" style={{ marginLeft: 'auto' }}>for leaders</span>
            </div>
            <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 44, lineHeight: 1, letterSpacing: '-0.02em', margin: '0 0 10px' }}>
              The pastoral <i>lens</i>.
            </h3>
            <p style={{ fontFamily: 'var(--f-body)', fontSize: 13, color: 'var(--ink-2)', marginBottom: 20 }}>
              For Heads, Year Leads and Class Teachers.
            </p>
            <p style={{ fontSize: 17, color: 'var(--ink)', margin: '0 0 24px', lineHeight: 1.5, maxWidth: '42ch' }}>
              Upload an Arbor MIS export and get a calm, role-filtered dashboard —
              with the pupils who need attention surfaced at the top.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14.5, color: 'var(--ink-2)' }}>
              {[
                'Drop in a CSV; read the school in 30 seconds',
                'Ask in plain English: "which Year 3 pupils are below expected in Writing?"',
                'AI pastoral summaries per pupil — narrative + recommended actions',
                'Per-role dashboards: SLT sees everything, Year Leads see their cohort',
              ].map((item) => (
                <li key={item} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--ink-3)', flexShrink: 0, transform: 'translateY(-2px)' }} />
                  {item}
                </li>
              ))}
            </ul>

            <div style={{ marginTop: 'auto', border: '1px solid var(--chalk-green-line)', borderRadius: 10, background: 'var(--paper)', padding: 16, fontFamily: 'var(--f-mono)', fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.6 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--ink)' }}>
                <span style={{ fontFamily: 'var(--f-ui)', fontSize: 10, background: 'var(--paper-3)', padding: '2px 6px', borderRadius: 3, color: 'var(--ink-3)', fontWeight: 700 }}>MS. HARPER</span>
                <span>Show me Year 6 at risk of persistent absence</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                <span style={{ fontFamily: 'var(--f-ui)', fontSize: 10, background: 'var(--chalk-green-soft)', padding: '2px 6px', borderRadius: 3, color: 'var(--chalk-green)', fontWeight: 700 }}>ARBOR</span>
                <span style={{ color: 'var(--ink)' }}>4 pupils flagged · 2 with combined risk →</span>
              </div>
            </div>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
              <Link href="/arbor/dashboard" className="btn btn--ghost" style={{ borderColor: 'var(--chalk-green)', color: 'var(--chalk-green)' }}>
                Open Arbor AI
                <svg className="ico" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
