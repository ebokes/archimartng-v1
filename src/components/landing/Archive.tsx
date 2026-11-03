import {
  BookOpen,
  Compass,
  FileSpreadsheet,
  LineChart,
  BarChart3,
  Briefcase,
  Check,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const resources = [
  {
    icon: BookOpen,
    title: 'Construction eBooks',
    desc: 'In-depth guides on modern building methods, materials, and site management for the African market.',
    tag: 'eBook',
  },
  {
    icon: Compass,
    title: 'Architectural Guides',
    desc: 'Design principles, climate-responsive techniques, and planning standards from leading practitioners.',
    tag: 'Guide',
  },
  {
    icon: FileSpreadsheet,
    title: 'BOQ Templates',
    desc: 'Editable Bills of Quantities for duplexes, bungalows, flats and commercial builds — ready to customize.',
    tag: 'Template',
  },
  {
    icon: LineChart,
    title: 'Cost Reports',
    desc: 'Up-to-date material and labour cost benchmarks across Nigerian and African cities.',
    tag: 'Report',
  },
  {
    icon: BarChart3,
    title: 'Market Intelligence',
    desc: 'Real estate trends, demand forecasts, and investment outlooks for African construction markets.',
    tag: 'Intelligence',
  },
  {
    icon: Briefcase,
    title: 'Developer Playbooks',
    desc: 'Step-by-step blueprints for launching, financing and scaling property development projects.',
    tag: 'Playbook',
  },
]

const tiers = [
  {
    name: 'ARCHIVE BASIC',
    price: '₦9,500',
    period: '/month',
    desc: 'For students and early-career professionals.',
    features: [
      'Access to eBooks library',
      'Selected architectural guides',
      'Monthly cost snapshot',
      'Community access',
    ],
    cta: 'Start Basic',
    highlight: false,
  },
  {
    name: 'ARCHIVE PRO',
    price: '₦24,000',
    period: '/month',
    desc: 'For working architects, builders & developers.',
    features: [
      'Everything in Basic',
      'Full BOQ template library',
      'Quarterly cost & market reports',
      'Developer playbooks',
      'Priority new releases',
    ],
    cta: 'Go Pro',
    highlight: true,
  },
  {
    name: 'ARCHIVE ELITE',
    price: '₦65,000',
    period: '/month',
    desc: 'For firms, investors & institutions.',
    features: [
      'Everything in Pro',
      'Custom market intelligence',
      'Team seats (up to 10)',
      '1-on-1 expert briefings',
      'Early access to research',
    ],
    cta: 'Join Elite',
    highlight: false,
  },
]

export function Archive() {
  return (
    <section
      id="archive"
      className="relative py-20 md:py-28 bg-background overflow-hidden"
    >
      <div className="absolute inset-0 blueprint-grid-fine blueprint-mask opacity-40 pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Badge className="mb-4 bg-accent/15 text-accent border border-accent/30 hover:bg-accent/15">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            ARCHIVE™ — Construction Knowledge Hub
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
            Build Smarter with{' '}
            <span className="gold-text-gradient">Expert Knowledge</span>
          </h2>
          <p className="mt-5 text-base md:text-lg text-muted-foreground leading-relaxed">
            Access premium construction intelligence, templates, reports, and
            expert resources designed for African builders, developers,
            architects, and professionals.
          </p>
        </div>

        {/* Resource cards */}
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((r) => (
            <div
              key={r.title}
              className="group relative rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-accent/40"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <div className="flex items-center justify-between">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-accent-foreground"
                  style={{
                    background: 'var(--gradient-gold)',
                    boxShadow: 'var(--shadow-gold)',
                  }}
                >
                  <r.icon className="h-6 w-6" />
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] uppercase tracking-wider text-muted-foreground"
                >
                  {r.tag}
                </Badge>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">
                {r.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {r.desc}
              </p>
              <div className="mt-5 flex items-center text-sm font-medium text-accent">
                Explore library
                <span className="ml-1 transition-transform group-hover:translate-x-1">
                  →
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Subscription tiers */}
        <div className="mt-20">
          <div className="mx-auto max-w-2xl text-center">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground">
              Choose your ARCHIVE™ membership
            </h3>
            <p className="mt-3 text-muted-foreground">
              Unlock the knowledge layer powering Africa's next generation of
              builders.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {tiers.map((t) => (
              <div
                key={t.name}
                className={`relative rounded-2xl border p-7 flex flex-col ${
                  t.highlight
                    ? 'border-accent bg-card'
                    : 'border-border bg-card'
                }`}
                style={{
                  boxShadow: t.highlight
                    ? 'var(--shadow-luxury)'
                    : 'var(--shadow-card)',
                }}
              >
                {t.highlight && (
                  <Badge
                    className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground border-0"
                    style={{ boxShadow: 'var(--shadow-gold)' }}
                  >
                    Most Popular
                  </Badge>
                )}
                <h4 className="text-sm font-bold tracking-widest text-accent">
                  {t.name}
                </h4>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">
                    {t.price}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {t.period}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{t.desc}</p>

                <ul className="mt-6 space-y-3 flex-1">
                  {t.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-foreground"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className={`mt-7 w-full font-semibold ${
                    t.highlight
                      ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  }`}
                  style={
                    t.highlight
                      ? { boxShadow: 'var(--shadow-gold)' }
                      : undefined
                  }
                >
                  <a href="#waitlist">{t.cta}</a>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
