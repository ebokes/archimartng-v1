import {
  Bot,
  Sparkles,
  Compass,
  Calculator,
  BookOpen,
  HardHat,
  ClipboardCheck,
  ArrowRight,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const capabilities = [
  {
    icon: Compass,
    title: 'Plan Matcher',
    desc: 'Find the right architectural plan for your plot, family size and budget.',
  },
  {
    icon: Calculator,
    title: 'Cost Advisor',
    desc: 'Get instant cost ranges by city, building type and complexity.',
  },
  {
    icon: BookOpen,
    title: 'Design Explainer',
    desc: 'Understand floor plans, layouts and trade-offs in plain language.',
  },
  {
    icon: HardHat,
    title: 'Build Advisor',
    desc: 'Step-by-step guidance — materials, sequencing and common pitfalls.',
  },
  {
    icon: ClipboardCheck,
    title: 'Project Readiness Checker',
    desc: 'Land docs, approvals, budget buffer — are you actually ready to build?',
  },
]

const sampleQuestions = [
  'What can I build on a 50×100 plot in Abuja?',
  'Estimate a 4-bedroom duplex in Lekki at mid-range finish.',
  'Which professionals do I need for a 6-flat in Enugu?',
  'Am I ready to start construction next month?',
]

export function ArchiAI() {
  return (
    <section id="archi-ai" className="relative py-20 md:py-28 overflow-hidden">
      <div
        className="absolute inset-0 -z-10"
        style={{ background: 'var(--gradient-hero)' }}
      />
      <div className="absolute inset-0 -z-10 blueprint-grid blueprint-mask opacity-50" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <Badge className="mb-4 bg-accent/15 text-accent border border-accent/30 hover:bg-accent/15">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Meet ARCHI AI
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
              Your personal{' '}
              <span className="gold-text-gradient">
                construction intelligence
              </span>{' '}
              assistant
            </h2>
            <p className="mt-5 text-base md:text-lg text-muted-foreground leading-relaxed">
              ARCHI AI is purpose-built for African construction — not a generic
              chatbot. Plans, costs, professionals and readiness checks, all in
              one conversation.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {capabilities.map((c) => (
                <div
                  key={c.title}
                  className="rounded-xl border border-border bg-card p-4"
                  style={{ boxShadow: 'var(--shadow-card)' }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="grid h-8 w-8 place-items-center rounded-lg text-accent-foreground"
                      style={{ background: 'var(--gradient-gold)' }}
                    >
                      <c.icon className="h-4 w-4" />
                    </div>
                    <div className="text-sm font-semibold text-foreground">
                      {c.title}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    {c.desc}
                  </p>
                </div>
              ))}
            </div>

            <Button
              asChild
              size="lg"
              className="mt-8 h-12 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
              style={{ boxShadow: 'var(--shadow-gold)' }}
            >
              <a href="#waitlist">
                Try ARCHI AI — Early Access <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>

          {/* Mock chat */}
          <div className="relative">
            <div
              className="rounded-3xl border border-accent/30 bg-card p-5"
              style={{ boxShadow: 'var(--shadow-luxury)' }}
            >
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <div
                  className="grid h-9 w-9 place-items-center rounded-full text-accent-foreground"
                  style={{ background: 'var(--gradient-gold)' }}
                >
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    ARCHI AI
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Construction intelligence · online
                  </div>
                </div>
                <Badge className="ml-auto bg-accent/15 text-accent border border-accent/30 hover:bg-accent/15 text-[10px]">
                  BETA
                </Badge>
              </div>

              <div className="mt-4 space-y-3">
                <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2.5 text-sm text-primary-foreground">
                  What can I build on a 50×100 plot in Abuja with ₦60M?
                </div>
                <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-secondary px-3.5 py-2.5 text-sm text-foreground">
                  On a 50×100 (≈465 sqm) plot in Abuja with ₦60M, you can
                  realistically build a
                  <span className="font-semibold">
                    {' '}
                    4-bedroom detached duplex
                  </span>{' '}
                  at mid-range finish, with ~10% buffer for fittings.
                  <div className="mt-2 rounded-lg border border-border bg-card p-2 text-xs text-muted-foreground">
                    Estimated build:{' '}
                    <span className="font-semibold text-foreground">
                      ₦48M – ₦56M
                    </span>{' '}
                    · Design:{' '}
                    <span className="font-semibold text-foreground">
                      ₦2.8M – ₦4M
                    </span>{' '}
                    · Timeline:{' '}
                    <span className="font-semibold text-foreground">
                      10–12 months
                    </span>
                  </div>
                </div>
                <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-secondary px-3.5 py-2.5 text-sm text-foreground">
                  Want me to match you with 3 verified architects in Abuja?
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
                {sampleQuestions.map((q) => (
                  <span
                    key={q}
                    className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground"
                  >
                    {q}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
