export function ToolShowcase() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        {/* ChalkAI preview */}
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--amber-border)] bg-[var(--amber-dim)] px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--amber)]" />
              <span className="text-xs font-semibold uppercase tracking-widest text-[var(--amber)]">ChalkAI</span>
            </div>
            <h3 className="font-serif text-3xl leading-tight text-[var(--ink)] md:text-4xl">
              A teaching assistant that actually knows your class.
            </h3>
            <p className="mt-4 text-[var(--ink2)] leading-relaxed">
              Tell ChalkAI once what you teach and how. From then on every lesson plan,
              worksheet, quiz or parent email is pitched for <em className="text-[var(--amber)] not-italic">your</em>{' '}
              year group, curriculum and class profile.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-[var(--ink2)]">
              <li className="flex items-start gap-3">
                <span className="mt-1.5 h-1 w-1 rounded-full bg-[var(--amber)]" />
                Clarifies before it generates — no generic output
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 h-1 w-1 rounded-full bg-[var(--amber)]" />
                One-click refinements (shorter, more scaffolding, plain English)
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 h-1 w-1 rounded-full bg-[var(--amber)]" />
                Rosenshine, Bloom&rsquo;s, retrieval practice — applied silently
              </li>
            </ul>
          </div>

          {/* Chat mockup */}
          <div className="chalkai-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[var(--amber)]" />
                <span className="text-xs font-medium text-[var(--ink2)]">Assistant</span>
              </div>
              <span className="font-mono text-[10px] text-[var(--ink3)]">/bloom /retrieval /differentiate</span>
            </div>

            <div className="space-y-4 p-5">
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[var(--surface3)] px-4 py-2.5 text-sm text-[var(--ink)]">
                  I need a quick retrieval starter on Year 4 fractions for tomorrow
                </div>
              </div>

              <div className="flex">
                <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-[var(--amber-border)] bg-[var(--amber-dim)] px-4 py-3 text-sm text-[var(--ink)]">
                  <div className="mb-2 font-display text-xs font-bold uppercase tracking-widest text-[var(--amber)]">
                    5-minute retrieval starter
                  </div>
                  <ol className="space-y-1.5 text-[var(--ink2)]">
                    <li>1. Shade ½ of this shape. What fraction is unshaded?</li>
                    <li>2. Is ¼ bigger or smaller than ½? Why?</li>
                    <li>3. Name three real objects halved every day.</li>
                    <li>4. Write ¾ in words.</li>
                  </ol>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="rounded-md border border-[var(--border2)] bg-[var(--surface2)] px-2 py-0.5 text-[10px] text-[var(--ink2)]">Make it harder</span>
                    <span className="rounded-md border border-[var(--border2)] bg-[var(--surface2)] px-2 py-0.5 text-[10px] text-[var(--ink2)]">Add pictures</span>
                    <span className="rounded-md border border-[var(--border2)] bg-[var(--surface2)] px-2 py-0.5 text-[10px] text-[var(--ink2)]">Save</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Arbor preview */}
        <div className="mt-32 grid items-center gap-12 md:grid-cols-2">
          <div className="order-2 md:order-1">
            {/* Dashboard mockup */}
            <div className="chalkai-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: 'var(--green)' }} />
                  <span className="text-xs font-medium text-[var(--ink2)]">Oakfield Primary · Headteacher view</span>
                </div>
                <span className="font-mono text-[10px] text-[var(--ink3)]">210 pupils</span>
              </div>

              <div className="grid grid-cols-3 gap-3 p-5">
                <StatCell label="Attendance" value="94.2%" sub="+0.4 w/w" tone="green" />
                <StatCell label="At-risk pupils" value="18" sub="9 high · 9 medium" tone="amber" />
                <StatCell label="PA rate" value="8.1%" sub="17 pupils" tone="red" />
              </div>

              <div className="border-t border-[var(--border)] px-5 py-4">
                <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--ink3)]">
                  Priority pupils
                </div>
                <div className="space-y-2">
                  {[
                    { name: 'Aisha K.', year: 'Year 3', flag: 'PA + Writing below', level: 'high' },
                    { name: 'Jaylen R.', year: 'Year 5', flag: 'Lateness pattern', level: 'medium' },
                    { name: 'Noor M.', year: 'Year 2', flag: 'Combined risk', level: 'high' },
                  ].map((p) => (
                    <div key={p.name} className="flex items-center justify-between rounded-lg bg-[var(--surface2)] px-3 py-2">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface3)] text-[11px] text-[var(--ink2)]">
                          {p.name[0]}
                        </span>
                        <div>
                          <div className="text-sm text-[var(--ink)]">{p.name}</div>
                          <div className="text-[11px] text-[var(--ink3)]">{p.year} · {p.flag}</div>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${
                          p.level === 'high' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'
                        }`}
                      >
                        {p.level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 md:order-2">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1" style={{ background: 'var(--green-dim)', border: '1px solid var(--green-border)' }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--green)' }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--green)' }}>Arbor AI</span>
            </div>
            <h3 className="font-serif text-3xl leading-tight text-[var(--ink)] md:text-4xl">
              Upload your Arbor export. See your whole school in ten seconds.
            </h3>
            <p className="mt-4 text-[var(--ink2)] leading-relaxed">
              Pastoral risk, attendance patterns and attainment concerns —
              rolled up to the school, drilled down to individual pupils. Ask questions in plain English,
              get answers with real names and real numbers.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-[var(--ink2)]">
              <li className="flex items-start gap-3">
                <span className="mt-1.5 h-1 w-1 rounded-full" style={{ background: 'var(--green)' }} />
                Works with Arbor MIS exports and common spreadsheet formats
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 h-1 w-1 rounded-full" style={{ background: 'var(--green)' }} />
                Role-filtered views: Headteacher, Year Lead, Class Teacher
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 h-1 w-1 rounded-full" style={{ background: 'var(--green)' }} />
                AI summaries you can paste straight into a pastoral meeting
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

function StatCell({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: 'green' | 'amber' | 'red' }) {
  const toneColor = {
    green: 'var(--green)',
    amber: 'var(--amber)',
    red:   '#ef4444',
  }[tone]
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface2)] p-3">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--ink3)]">{label}</div>
      <div className="mt-1 font-serif text-2xl text-[var(--ink)]">{value}</div>
      <div className="mt-0.5 text-[10px]" style={{ color: toneColor }}>{sub}</div>
    </div>
  )
}
