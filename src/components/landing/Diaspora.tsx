import {
  Globe2,
  ShieldCheck,
  Camera,
  Wallet,
  ClipboardCheck,
  Users,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const features = [
  {
    icon: Users,
    title: 'Verified Professionals',
    desc: 'Only KYC-checked architects, builders and engineers.',
  },
  {
    icon: ShieldCheck,
    title: 'Escrow-Protected Payments',
    desc: 'Funds are released only when milestones are met.',
  },
  {
    icon: Camera,
    title: 'Live Project Tracking',
    desc: 'Photos, videos and contractor updates from site.',
  },
  {
    icon: Wallet,
    title: 'Cost Transparency',
    desc: 'AI-backed estimates and clear, itemized budgets.',
  },
  {
    icon: ClipboardCheck,
    title: 'Remote Project Management',
    desc: 'Approvals, documents and reporting from anywhere.',
  },
  {
    icon: Globe2,
    title: 'Built for the Diaspora',
    desc: 'Pay in your currency. Build with peace of mind back home.',
  },
]

export function Diaspora() {
  return (
    <section id="diaspora" className="relative py-20 md:py-28 overflow-hidden">
      <div
        className="absolute inset-0 -z-10"
        style={{ background: 'var(--gradient-hero)' }}
      />
      <div className="absolute inset-0 -z-10 blueprint-grid blueprint-mask opacity-40" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Badge className="mb-4 bg-accent/15 text-accent border border-accent/30 hover:bg-accent/15">
            <Globe2 className="mr-1.5 h-3.5 w-3.5" /> Diaspora Build Hub — Build
            From Anywhere
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
            Building back home{' '}
            <span className="gold-text-gradient">shouldn't feel risky.</span>
          </h2>
          <p className="mt-5 text-base md:text-lg text-muted-foreground leading-relaxed">
            ARCHIMARTng gives Africans abroad a secure way to design, hire and
            build — with verified professionals, escrow-protected payments and
            live site visibility.
          </p>
          <div className="mt-7 flex justify-center">
            <Button
              asChild
              size="lg"
              className="h-12 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
              style={{ boxShadow: 'var(--shadow-gold)' }}
            >
              <a href="#waitlist">
                Start My Project <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-card p-6"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-accent-foreground"
                style={{
                  background: 'var(--gradient-gold)',
                  boxShadow: 'var(--shadow-gold)',
                }}
              >
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">
                {f.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
