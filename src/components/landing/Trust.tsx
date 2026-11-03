import { BadgeCheck, Lock, UserCheck, CreditCard } from 'lucide-react'

const items = [
  {
    icon: BadgeCheck,
    title: 'KYC Verification',
    desc: 'Every pro passes ID and credentials checks.',
  },
  {
    icon: Lock,
    title: 'Escrow Protection',
    desc: 'Funds released only on agreed milestones.',
  },
  {
    icon: UserCheck,
    title: 'Verified Professionals',
    desc: 'Reviewed portfolios and client ratings.',
  },
  {
    icon: CreditCard,
    title: 'Secure Payments',
    desc: 'Bank-grade encryption on every transaction.',
  },
]

export function Trust() {
  return (
    <section
      className="relative overflow-hidden py-20 lg:py-28"
      style={{ background: 'var(--gradient-navy)' }}
    >
      <div className="absolute inset-0 blueprint-grid opacity-15" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[oklch(0.17_0.03_264/0.6)]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
            Built on trust
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-navy-foreground sm:text-4xl lg:text-5xl">
            Build with total peace of mind
          </h2>
          <p className="mt-4 text-lg text-navy-foreground/70">
            Security and accountability built into every project.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((i) => (
            <div
              key={i.title}
              className="group relative overflow-hidden rounded-2xl border border-navy-foreground/10 bg-navy-foreground/5 p-6 backdrop-blur transition-all hover:-translate-y-1 hover:border-accent/40"
            >
              <div
                className="grid h-12 w-12 place-items-center rounded-xl text-accent-foreground"
                style={{ background: 'var(--gradient-gold)' }}
              >
                <i.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-navy-foreground">
                {i.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-foreground/70">
                {i.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
