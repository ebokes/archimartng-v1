import { X, Check } from 'lucide-react'

const traditional = [
  'Weeks finding professionals',
  'Expensive redesigns',
  'Unverified contractors',
  'Budget uncertainty',
  'Poor accountability',
]
const archimartng = [
  'Instant architectural plans',
  'AI-powered recommendations',
  'Verified professionals',
  'Escrow-secured payments',
  'Transparent milestone tracking',
]

export function WhyArchimartng() {
  return (
    <section className="relative overflow-hidden bg-muted/40 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
            Why ARCHIMARTng
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Building shouldn't be this difficult
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Traditional construction is fragmented, expensive and risky. We
            changed that.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {/* Traditional */}
          <div
            className="rounded-3xl border border-border bg-background p-8"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-destructive">
              <span className="inline-block h-2 w-2 rounded-full bg-destructive" />
              Traditional process
            </div>
            <h3 className="mt-3 text-2xl font-bold text-foreground">
              The old way
            </h3>
            <ul className="mt-6 space-y-4">
              {traditional.map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-6 w-6 place-items-center rounded-full bg-destructive/10 text-destructive">
                    <X className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm text-muted-foreground line-through decoration-destructive/40">
                    {t}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* ARCHIMARTng */}
          <div
            className="relative overflow-hidden rounded-3xl border border-accent/30 p-8 text-navy-foreground"
            style={{
              background: 'var(--gradient-navy)',
              boxShadow: 'var(--shadow-luxury)',
            }}
          >
            <div className="absolute inset-0 -z-10 blueprint-grid opacity-20" />
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
              <span className="inline-block h-2 w-2 rounded-full bg-accent" />
              With ARCHIMARTng
            </div>
            <h3 className="mt-3 text-2xl font-bold">The smarter way</h3>
            <ul className="mt-6 space-y-4">
              {archimartng.map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-6 w-6 place-items-center rounded-full bg-accent text-accent-foreground">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm text-navy-foreground/90">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
