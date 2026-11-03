import {
  BadgeCheck,
  Star,
  Trophy,
  Clock,
  MapPin,
  Briefcase,
  ArrowUpRight,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type Pro = {
  name: string
  role: string
  city: string
  rate: string
  response: string
  rating: number
  projects: number
  specialization: string
  badges: ('Verified' | 'Top Rated' | 'Specialist')[]
  initials: string
}

const pros: Pro[] = [
  {
    name: 'Adaeze O.',
    role: 'Principal Architect',
    city: 'Lagos',
    rate: '₦1.2M – ₦3.5M / project',
    response: '~2 hrs',
    rating: 4.9,
    projects: 47,
    specialization: 'Modern duplexes',
    badges: ['Verified', 'Top Rated'],
    initials: 'AO',
  },
  {
    name: 'Tunde A.',
    role: 'Civil Engineer',
    city: 'Abuja',
    rate: '₦450k – ₦1.8M / project',
    response: '~1 hr',
    rating: 4.8,
    projects: 62,
    specialization: 'Structural design',
    badges: ['Verified', 'Specialist'],
    initials: 'TA',
  },
  {
    name: 'Chiamaka N.',
    role: 'Quantity Surveyor',
    city: 'Port Harcourt',
    rate: '₦300k – ₦900k / project',
    response: '~3 hrs',
    rating: 4.95,
    projects: 38,
    specialization: 'BOQ & cost control',
    badges: ['Verified', 'Top Rated', 'Specialist'],
    initials: 'CN',
  },
]

const badgeStyle: Record<Pro['badges'][number], string> = {
  Verified: 'bg-accent/15 text-accent border-accent/30',
  'Top Rated': 'bg-primary/10 text-primary border-primary/20',
  Specialist: 'bg-secondary text-foreground border-border',
}
const badgeIcon: Record<
  Pro['badges'][number],
  React.ComponentType<{ className?: string }>
> = {
  Verified: BadgeCheck,
  'Top Rated': Star,
  Specialist: Trophy,
}

export function VerifiedProfiles() {
  return (
    <section id="verified" className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Badge className="mb-4 bg-accent/15 text-accent border border-accent/30 hover:bg-accent/15">
            <BadgeCheck className="mr-1.5 h-3.5 w-3.5" /> Verified Professional
            Profiles
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
            Trust starts with{' '}
            <span className="gold-text-gradient">verified credentials</span>
          </h2>
          <p className="mt-5 text-base md:text-lg text-muted-foreground leading-relaxed">
            Every professional on ARCHIMARTng goes through KYC, credential
            checks and portfolio review — so you hire with confidence, not
            crossed fingers.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {pros.map((p) => (
            <div
              key={p.name}
              className="group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-accent/40"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="grid h-14 w-14 shrink-0 place-items-center rounded-full text-accent-foreground text-base font-bold"
                  style={{
                    background: 'var(--gradient-gold)',
                    boxShadow: 'var(--shadow-gold)',
                  }}
                >
                  {p.initials}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">
                      {p.name}
                    </h3>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-accent" />
                  </div>
                  <div className="text-sm text-muted-foreground">{p.role}</div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {p.city}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {p.badges.map((b) => {
                  const Icon = badgeIcon[b]
                  return (
                    <span
                      key={b}
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${badgeStyle[b]}`}
                    >
                      <Icon className="h-3 w-3" /> {b}
                    </span>
                  )
                })}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                <Field icon={Star} label="Rating" value={`${p.rating} / 5`} />
                <Field
                  icon={Briefcase}
                  label="Projects"
                  value={`${p.projects} done`}
                />
                <Field icon={Clock} label="Response" value={p.response} />
                <Field
                  icon={BadgeCheck}
                  label="Specialization"
                  value={p.specialization}
                />
              </div>

              <div className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
                Pricing range:{' '}
                <span className="font-semibold text-foreground">{p.rate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-2.5">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3 text-accent" /> {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold text-foreground">
        {value}
      </div>
    </div>
  )
}
