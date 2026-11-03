import { Wand2, Calculator, BookOpen, Sparkles } from 'lucide-react'

const features = [
  {
    icon: Wand2,
    title: 'AI Plan Matcher',
    desc: 'Find plans matched to your land size, budget, family size and lifestyle.',
    points: ['Land size', 'Budget', 'Family size', 'Lifestyle'],
  },
  {
    icon: Calculator,
    title: 'AI Cost Estimator',
    desc: 'Realistic, location-aware construction estimates — before you break ground.',
    points: ['Lagos · Abuja · PH', 'Materials & labor', 'Range + confidence'],
  },
  {
    icon: BookOpen,
    title: 'AI Design Explainer',
    desc: 'Understand any plan in plain language — rooms, flow, materials and structure.',
    points: ['Plain-language', 'Flow analysis', 'Material notes'],
  },
]

export function AIFeatures() {
  return (
    <section id="features" className="relative overflow-hidden py-20 lg:py-28">
      <div className="absolute inset-0 -z-10 blueprint-grid-fine blueprint-mask opacity-50" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
            <Sparkles className="h-3.5 w-3.5" /> AI Built-In
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Powered by AI to help you build better
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Intelligent tools that transform ideas into buildable, budgeted
            projects.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:-translate-y-1 hover:border-accent/40"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/10 blur-3xl transition-opacity duration-500 group-hover:bg-accent/20" />
              <div
                className="mb-6 grid h-12 w-12 place-items-center rounded-xl text-accent-foreground"
                style={{ background: 'var(--gradient-gold)' }}
              >
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">
                {f.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {f.desc}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {f.points.map((p) => (
                  <span
                    key={p}
                    className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
