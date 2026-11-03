import { TrendingUp, Building2, Network, ShieldAlert } from 'lucide-react'

const drivers = [
  {
    icon: TrendingUp,
    title: 'Rapid urbanization',
    desc: "Africa's urban population is set to double by 2050.",
  },
  {
    icon: Building2,
    title: 'Growing housing demand',
    desc: 'Nigeria alone faces a ~28M-unit housing deficit.',
  },
  {
    icon: Network,
    title: 'Construction fragmentation',
    desc: 'Builders, designers and pros remain disconnected.',
  },
  {
    icon: ShieldAlert,
    title: 'Trust gaps in execution',
    desc: 'Payment risk and accountability still hold projects back.',
  },
]

export function WhyNow() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      <div className="absolute inset-0 -z-10 blueprint-grid blueprint-mask opacity-50" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
            Why now
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Africa is building faster than ever
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            The continent's construction sector is exploding — but the way
            projects move from idea to execution hasn't kept up.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {drivers.map((d) => (
            <div
              key={d.title}
              className="rounded-2xl border border-border bg-card p-6"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent/15 text-accent">
                <d.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">
                {d.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {d.desc}
              </p>
            </div>
          ))}
        </div>

        <div
          className="mx-auto mt-12 max-w-3xl rounded-3xl border border-accent/30 p-8 text-center text-primary-foreground"
          style={{
            background: 'var(--gradient-navy)',
            boxShadow: 'var(--shadow-luxury)',
          }}
        >
          <p className="text-lg sm:text-xl font-medium text-white">
            ARCHIMARTng is digitizing how buildings move from{' '}
            <span className="gold-text-gradient font-bold">
              idea to execution
            </span>
            .
          </p>
        </div>
      </div>
    </section>
  )
}
