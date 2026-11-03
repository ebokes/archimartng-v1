import {
  Compass,
  HardHat,
  Cog,
  Calculator,
  Sofa,
  Wrench,
  ArrowUpRight,
  BadgeCheck,
} from 'lucide-react'

const roles = [
  {
    icon: Compass,
    title: 'Architects',
    spec: 'Design & drafting',
    desc: 'Custom designs, plan reviews and full architectural services.',
  },
  {
    icon: HardHat,
    title: 'Builders',
    spec: 'Site execution',
    desc: 'Vetted contractors to take your project from foundation to finish.',
  },
  {
    icon: Cog,
    title: 'Engineers',
    spec: 'Structural · Civil · MEP',
    desc: 'Engineers for safe, code-compliant builds.',
  },
  {
    icon: Calculator,
    title: 'Quantity Surveyors',
    spec: 'BOQ & cost control',
    desc: 'Accurate BOQs, cost control and budget management.',
  },
  {
    icon: Sofa,
    title: 'Interior Designers',
    spec: 'Turnkey interiors',
    desc: 'Interiors that match the quality of your structure.',
  },
  {
    icon: Wrench,
    title: 'Artisans',
    spec: 'Skilled trades',
    desc: 'Verified craftsmen — tilers, electricians, plumbers, painters, welders and more.',
  },
]

export function Professionals() {
  return (
    <section id="professionals" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
            Professional Network
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Hire the right professionals at every stage
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Every professional on ARCHIMARTng is identity-verified and reviewed.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((r) => (
            <a
              key={r.title}
              href="#waitlist"
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:border-accent/40 hover:-translate-y-1"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent/10 blur-2xl opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <r.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">
                      {r.title}
                    </h3>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-accent" />
                  </div>
                  <div className="mt-0.5 text-xs font-medium text-accent">
                    {r.spec}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {r.desc}
                  </p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-border pt-4 text-[11px] font-medium text-muted-foreground">
                <span className="inline-flex items-center gap-1 text-accent">
                  <BadgeCheck className="h-3.5 w-3.5" /> KYC Verified
                </span>
                <span className="opacity-50">·</span>
                <span>Reviewed portfolios</span>
                <span className="opacity-50">·</span>
                <span>Escrow-ready</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
