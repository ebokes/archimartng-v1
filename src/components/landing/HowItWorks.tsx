const steps = [
  {
    n: '01',
    title: 'Find a Plan',
    desc: 'Browse the marketplace or get AI-powered recommendations.',
  },
  {
    n: '02',
    title: 'Customize if Needed',
    desc: 'Work with verified architects to tailor your design.',
  },
  {
    n: '03',
    title: 'Hire Verified Professionals',
    desc: 'Connect with trusted builders, engineers and surveyors.',
  },
  {
    n: '04',
    title: 'Build Securely',
    desc: 'Track milestones with escrow-protected payments.',
  },
]

export function HowItWorks() {
  return (
    <section id="how" className="relative overflow-hidden py-20 lg:py-28">
      <div className="absolute inset-0 -z-10 blueprint-grid-fine blueprint-mask opacity-40" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
            How it works
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            From Blueprint to Building — In Four Simple Steps
          </h2>
        </div>

        <div className="relative mt-16">
          <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent lg:block" />
          <ol className="grid gap-10 lg:grid-cols-4">
            {steps.map((s, idx) => (
              <li key={s.n} className="relative">
                <div
                  className="relative mx-auto grid h-14 w-14 place-items-center rounded-full text-lg font-bold text-accent-foreground ring-8 ring-background"
                  style={{
                    background: 'var(--gradient-gold)',
                    boxShadow: 'var(--shadow-gold)',
                  }}
                >
                  {s.n}
                </div>
                {idx < steps.length - 1 && (
                  <div className="absolute left-1/2 top-7 hidden h-px w-full -translate-y-1/2 bg-gradient-to-r from-accent/60 to-transparent lg:block" />
                )}
                <div
                  className="mt-6 rounded-2xl border border-border bg-card p-5 text-center"
                  style={{ boxShadow: 'var(--shadow-card)' }}
                >
                  <h3 className="text-lg font-semibold text-foreground">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {s.desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
