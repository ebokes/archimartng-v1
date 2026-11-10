const steps = [
  {
    number: '01',
    title: 'Browse',
    description: 'Explore published plans and professional profiles.',
  },
  {
    number: '02',
    title: 'Enquire',
    description: 'Send the Archimart team a question about a listing.',
  },
  {
    number: '03',
    title: 'Follow up',
    description:
      'An administrator reviews your enquiry and follows up manually.',
  },
]

export function HowItWorks() {
  return (
    <section id="how" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold">
            How it works
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            A straightforward way to explore your options
          </h2>
        </div>
        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((step) => (
            <li
              key={step.number}
              className="rounded-xl border border-border bg-card p-6"
            >
              <span className="text-sm font-semibold text-gold">
                {step.number}
              </span>
              <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
