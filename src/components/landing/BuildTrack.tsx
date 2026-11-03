import {
  Camera,
  Wallet,
  MessageSquare,
  BarChart3,
  CheckCircle2,
  Circle,
  Activity,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const milestones = [
  { name: 'Foundation', status: 'done', pct: 100 },
  { name: 'Structure', status: 'done', pct: 100 },
  { name: 'Roofing', status: 'active', pct: 65 },
  { name: 'Finishing', status: 'pending', pct: 0 },
  { name: 'Handover', status: 'pending', pct: 0 },
] as const

const features = [
  {
    icon: BarChart3,
    title: 'Milestone tracking',
    desc: 'From foundation to handover — every phase visible.',
  },
  {
    icon: Wallet,
    title: 'Escrow payment releases',
    desc: 'Funds released only when milestones are verified.',
  },
  {
    icon: Camera,
    title: 'Progress photos & video',
    desc: 'On-site media uploaded by the contractor each week.',
  },
  {
    icon: MessageSquare,
    title: 'Contractor updates',
    desc: 'In-app messaging, approvals and document sharing.',
  },
  {
    icon: Activity,
    title: 'Budget tracking',
    desc: 'Live spend-vs-budget with variance alerts.',
  },
]

export function BuildTrack() {
  return (
    <section id="buildtrack" className="py-20 md:py-28 bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Badge className="mb-4 bg-accent/15 text-accent border border-accent/30 hover:bg-accent/15">
            <Activity className="mr-1.5 h-3.5 w-3.5" /> BUILDTRACK™ — Remote
            Construction Monitoring
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
            See your build,{' '}
            <span className="gold-text-gradient">
              from anywhere in the world
            </span>
          </h2>
          <p className="mt-5 text-base md:text-lg text-muted-foreground leading-relaxed">
            A real-time construction dashboard built for diaspora and remote
            owners. Track milestones, release payments and see site progress
            with full transparency.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-5">
          {/* Dashboard mock */}
          <div
            className="lg:col-span-3 rounded-2xl border border-border bg-card p-6"
            style={{ boxShadow: 'var(--shadow-luxury)' }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Project
                </div>
                <div className="text-lg font-semibold text-foreground">
                  4BR Duplex · Lekki Phase 2
                </div>
              </div>
              <Badge className="bg-accent/15 text-accent border border-accent/30 hover:bg-accent/15">
                On track
              </Badge>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Kpi label="Overall progress" value="58%" />
              <Kpi label="Budget used" value="₦24M / ₦42M" />
              <Kpi label="In escrow" value="₦6.2M" />
            </div>

            <div className="mt-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Milestones
              </div>
              <ol className="mt-3 space-y-3">
                {milestones.map((m) => (
                  <li key={m.name} className="flex items-center gap-3">
                    {m.status === 'done' ? (
                      <CheckCircle2 className="h-5 w-5 text-accent" />
                    ) : m.status === 'active' ? (
                      <Activity className="h-5 w-5 text-accent animate-pulse" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm">
                        <span
                          className={`font-medium ${m.status === 'pending' ? 'text-muted-foreground' : 'text-foreground'}`}
                        >
                          {m.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {m.pct}%
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${m.pct}%`,
                            background: 'var(--gradient-gold)',
                          }}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button
                asChild
                className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                style={{ boxShadow: 'var(--shadow-gold)' }}
              >
                <a href="#waitlist">Request BUILDTRACK™ demo</a>
              </Button>
              <Button asChild variant="outline">
                <a href="#diaspora">For diaspora builders</a>
              </Button>
            </div>
          </div>

          {/* Feature list */}
          <div className="lg:col-span-2 grid gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-card p-5"
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="grid h-10 w-10 place-items-center rounded-lg text-accent-foreground"
                    style={{ background: 'var(--gradient-gold)' }}
                  >
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      {f.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {f.desc}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-lg font-bold text-foreground">{value}</div>
    </div>
  )
}
