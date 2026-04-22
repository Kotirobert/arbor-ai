import Link from 'next/link'

export function CtaBand() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--amber-border)] bg-gradient-to-br from-[var(--surface)] to-[#1a1713] p-12 text-center md:p-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{ background: 'radial-gradient(ellipse at top, rgba(232,163,42,0.15), transparent 70%)' }}
          />

          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-serif text-4xl leading-tight text-[var(--ink)] md:text-6xl">
              Stop rewriting{' '}
              <span className="italic text-[var(--amber)]">last year&rsquo;s worksheets.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-[var(--ink2)]">
              Set up takes under two minutes. Your first lesson plan takes thirty seconds.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--amber)] px-6 py-3 text-sm font-semibold text-[#0e0f0d] transition-transform hover:scale-[1.02]"
              >
                Start free
                <span aria-hidden>→</span>
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border2)] px-6 py-3 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--surface2)]"
              >
                I already have an account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
