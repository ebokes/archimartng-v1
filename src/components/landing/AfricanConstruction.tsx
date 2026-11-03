import { Ruler, Coins, BadgeCheck, ShieldCheck } from 'lucide-react'

const items = [
  {
    icon: Ruler,
    title: 'Plot Size Intelligence',
    desc: 'Designed for common land sizes like 50×100, 100×100 and custom plots.',
  },
  {
    icon: Coins,
    title: 'Local Cost Estimation',
    desc: 'Realistic build cost ranges tailored to local market realities.',
  },
  {
    icon: BadgeCheck,
    title: 'Verified Local Professionals',
    desc: 'Access vetted architects, builders, engineers and quantity surveyors.',
  },
  {
    icon: ShieldCheck,
    title: 'Smarter Project Protection',
    desc: 'Milestone-based escrow that reduces payment risk for everyone.',
  },
]

export function AfricanConstruction() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      <div className="absolute inset-0 -z-10 blueprint-grid-fine blueprint-mask opacity-50" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
            Built for Africa
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Built for the realities of African construction
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Smarter tools designed for how building projects actually happen
            across Africa.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((i) => (
            <div
              key={i.title}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-accent/40"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-accent/10 blur-2xl transition-opacity group-hover:opacity-100" />
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground">
                <i.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">
                {i.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {i.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
