'use client'

import { useMemo, useState } from 'react'
import {
  Calculator,
  Sparkles,
  MapPin,
  Ruler,
  Building2,
  Layers,
  Wallet,
  Clock,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const cityFactor: Record<string, number> = {
  Lagos: 1.2,
  Abuja: 1.15,
  'Port Harcourt': 1.1,
  Ibadan: 0.95,
  Kano: 0.9,
  Enugu: 0.95,
  Other: 1,
}
const typeBase: Record<string, number> = {
  Bungalow: 140000,
  Duplex: 180000,
  Flats: 160000,
  'Luxury Home': 260000,
  Commercial: 220000,
}
const complexityFactor: Record<string, number> = {
  Standard: 1,
  'Mid-range': 1.2,
  Premium: 1.5,
  Luxury: 1.85,
}
const designRate = 0.06 // 6% of build cost
const fmt = (n: number) => `₦${(n / 1_000_000).toFixed(1)}M`

export function SmartPricing() {
  const [plot, setPlot] = useState('500')
  const [city, setCity] = useState('Lagos')
  const [type, setType] = useState('Duplex')
  const [complexity, setComplexity] = useState('Mid-range')
  const [budget, setBudget] = useState('50')

  const result = useMemo(() => {
    const sqm = Math.max(40, Number(plot) || 0) * 0.45 // built area ~45% of plot
    const base =
      (typeBase[type] ?? 160000) *
      complexityFactor[complexity] *
      cityFactor[city]
    const build = sqm * base
    const buildLow = build * 0.9
    const buildHigh = build * 1.15
    const designLow = build * designRate * 0.8
    const designHigh = build * designRate * 1.2
    const months = Math.round(
      6 + sqm / 60 + (complexityFactor[complexity] - 1) * 6,
    )
    return {
      buildLow,
      buildHigh,
      designLow,
      designHigh,
      months,
      sqm: Math.round(sqm),
    }
  }, [plot, city, type, complexity])

  return (
    <section
      id="pricing"
      className="relative py-20 md:py-28 bg-secondary/40 overflow-hidden"
    >
      <div className="absolute inset-0 blueprint-grid-fine blueprint-mask opacity-40 pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Badge className="mb-4 bg-accent/15 text-accent border border-accent/30 hover:bg-accent/15">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" /> AI Cost Intelligence
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
            Smart Construction{' '}
            <span className="gold-text-gradient">Pricing</span>
          </h2>
          <p className="mt-5 text-base md:text-lg text-muted-foreground leading-relaxed">
            Transparent design and build estimates powered by ARCHI AI — no more
            guesswork, no more opaque quotes.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-5">
          {/* Inputs */}
          <div
            className="lg:col-span-2 rounded-2xl border border-border bg-card p-6"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Calculator className="h-5 w-5 text-accent" /> Project inputs
            </h3>
            <div className="mt-5 space-y-4">
              <div>
                <Label className="flex items-center gap-1.5">
                  <Ruler className="h-3.5 w-3.5 text-accent" /> Plot size (sqm)
                </Label>
                <Input
                  type="number"
                  min={40}
                  value={plot}
                  onChange={(e) => setPlot(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-accent" /> Location
                </Label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(cityFactor).map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-accent" /> Building
                  type
                </Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(typeBase).map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-accent" /> Complexity
                </Label>
                <Select value={complexity} onValueChange={setComplexity}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(complexityFactor).map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5 text-accent" /> Indicative
                  budget (₦M)
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>

          {/* Outputs */}
          <div
            className="lg:col-span-3 rounded-2xl border border-accent/30 bg-card p-6"
            style={{ boxShadow: 'var(--shadow-luxury)' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                AI estimate
              </h3>
              <Badge className="bg-accent/15 text-accent border border-accent/30 hover:bg-accent/15">
                ~{result.sqm} sqm built
              </Badge>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Stat
                label="Estimated build cost"
                value={`${fmt(result.buildLow)} – ${fmt(result.buildHigh)}`}
                icon={Building2}
              />
              <Stat
                label="Design cost range"
                value={`${fmt(result.designLow)} – ${fmt(result.designHigh)}`}
                icon={Layers}
              />
              <Stat
                label="Timeline estimate"
                value={`${result.months} months`}
                icon={Clock}
              />
              <Stat
                label="Recommended team"
                value="Architect · QS · Builder"
                icon={Users}
              />
            </div>

            <div className="mt-6 rounded-xl border border-dashed border-border bg-secondary/40 p-4 text-xs text-muted-foreground">
              Estimates are indicative and based on current market benchmarks.
              Final pricing is confirmed by your selected verified professional.
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button
                asChild
                className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                style={{ boxShadow: 'var(--shadow-gold)' }}
              >
                <a href="#waitlist">Get matched with professionals</a>
              </Button>
              <Button asChild variant="outline">
                <a href="#archive">Browse ARCHIVE™ cost reports</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="h-4 w-4 text-accent" /> {label}
      </div>
      <div className="mt-1.5 text-xl font-bold text-foreground">{value}</div>
    </div>
  )
}
