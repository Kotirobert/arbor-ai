export function HowItWorks() {
  const cells = [
    {
      num: '01',
      title: 'Upload once, used everywhere',
      body: 'Arbor MIS exports flow into Arbor AI. Teacher profiles flow into ChalkAI. Nothing has to be typed twice.',
    },
    {
      num: '02',
      title: 'One login, two tools',
      body: 'Role claims decide what you land on: teachers into ChalkAI, Heads and Year Leads into Arbor AI. Switch anytime.',
    },
    {
      num: '03',
      title: 'Quiet, not clever',
      body: 'No dashboards screaming for attention. The pupils and resources that matter today are at the top — the rest waits.',
    },
  ]

  return (
    <section id="how" style={{ padding: '80px 0 120px', borderTop: '1px solid var(--line)', marginTop: 80 }}>
      <div className="container">
        <div className="eyebrow" style={{ marginBottom: 16 }}>How it fits together</div>
        <h2 className="h1" style={{ maxWidth: '18ch' }}>
          A Year Lead spots the pupils who need help. A teacher plans{' '}
          <i style={{ color: 'var(--chalk-green)' }}>the lesson for them.</i>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 mt-14 border-t border-[var(--line)]">
          {cells.map((cell, i) => (
            <div
              key={cell.num}
              className={[
                'py-9 px-0',
                i > 0 ? 'md:pl-7' : '',
                i < 2 ? 'md:pr-7 md:border-r border-[var(--line)] border-b md:border-b-0' : '',
                i === 2 ? 'md:pl-7' : '',
              ].join(' ')}
            >
              <div style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: 28, color: 'var(--ink-3)', marginBottom: 12 }}>
                {cell.num}
              </div>
              <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 22, lineHeight: 1.2, margin: '0 0 10px', fontWeight: 400 }}>
                {cell.title}
              </h3>
              <p style={{ fontSize: 14.5, color: 'var(--ink-2)', margin: 0, lineHeight: 1.55 }}>
                {cell.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
