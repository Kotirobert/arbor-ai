'use client'

import { useState } from 'react'

const FAQS = [
  {
    q: 'Does ChalkAI share our school data with third parties?',
    a: 'No. School data (pupil names, attendance, attainment) is held in your browser session for Arbor AI and only sent to the AI provider when you explicitly run a query. Teacher profiles stay on your account and are never sold or shared.',
  },
  {
    q: 'Which curriculum does ChalkAI cover?',
    a: 'The default is UK National Curriculum (Primary and Secondary). Scottish CfE, Welsh curriculum, IB and SEN-specific schemes are also supported — you pick during signup and it adjusts every resource.',
  },
  {
    q: 'Which MIS exports work with Arbor AI?',
    a: 'Arbor MIS CSV exports are first-class. We also accept common spreadsheet formats (Student ID, year group, attendance %, subject bands). Direct Arbor API integration is on the roadmap.',
  },
  {
    q: 'Will other teachers see my saved resources?',
    a: 'On Free and Pro, only you see your history. On the School plan, you can optionally share resources to a school-wide library — but nothing is shared by default.',
  },
  {
    q: 'Can I cancel my subscription at any time?',
    a: 'Yes. Monthly plans cancel immediately at the end of your current billing period. No retention calls, no exit surveys.',
  },
  {
    q: 'Do you have case studies from schools using ChalkAI?',
    a: 'We&rsquo;re onboarding our pilot schools now. Email us if you&rsquo;d like to be part of it — early-access schools get discounted School-plan pricing for the first year.',
  },
]

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="relative py-24">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mb-12 text-center">
          <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--ink3)]">
            Frequently asked
          </div>
          <h2 className="font-serif text-4xl leading-tight text-[var(--ink)] md:text-5xl">
            The{' '}
            <span className="italic text-[var(--amber)]">awkward questions,</span>{' '}
            answered.
          </h2>
        </div>

        <div className="space-y-2">
          {FAQS.map((f, i) => {
            const isOpen = open === i
            return (
              <div
                key={i}
                className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-[var(--surface2)]"
                >
                  <span className="font-display text-[15px] font-medium text-[var(--ink)]">
                    {f.q}
                  </span>
                  <span
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-[var(--border2)] text-[var(--ink2)] transition-transform"
                    style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
                  >
                    +
                  </span>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-sm leading-relaxed text-[var(--ink2)] fade-in">
                    <div className="chalkai-divider mb-4" />
                    <p dangerouslySetInnerHTML={{ __html: f.a }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
