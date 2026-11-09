'use client'

import { useState } from 'react'
import { Bed, Bath, Maximize2, Sparkles, Flame, Trophy } from 'lucide-react'
import duplex from '@/assets/plan-duplex.jpg'
import bungalow from '@/assets/plan-bungalow.jpg'
import flats from '@/assets/plan-flats.jpg'
import luxury from '@/assets/plan-luxury.jpg'
import Image from 'next/image'
import Link from 'next/link'

const categories = [
  'All',
  'Duplexes',
  'Bungalows',
  'Flats',
  'Luxury Homes',
] as const

type Badge = { icon: typeof Sparkles; label: string }
const aiRec: Badge = { icon: Sparkles, label: 'AI Recommended' }
const bestFit: Badge = { icon: Flame, label: 'Best Fit · Mid Budget' }
const popular: Badge = { icon: Trophy, label: 'Most Popular' }

const plans = [
  {
    img: duplex,
    title: 'Contemporary 4BR Duplex',
    cat: 'Duplexes',
    beds: 4,
    baths: 5,
    sqm: 320,
    price: '₦120,000',
    build: '₦38M – ₦42M',
    badge: aiRec,
  },
  {
    img: bungalow,
    title: 'Modern 3BR Bungalow',
    cat: 'Bungalows',
    beds: 3,
    baths: 3,
    sqm: 180,
    price: '₦55,000',
    build: '₦18M – ₦22M',
    badge: bestFit,
  },
  {
    img: flats,
    title: 'Urban Block of Flats',
    cat: 'Flats',
    beds: 12,
    baths: 12,
    sqm: 950,
    price: '₦150,000',
    build: '₦95M – ₦110M',
    badge: popular,
  },
  {
    img: luxury,
    title: 'Lakeside Luxury Villa',
    cat: 'Luxury Homes',
    beds: 6,
    baths: 7,
    sqm: 620,
    price: '₦280,000',
    build: '₦140M – ₦180M',
    badge: aiRec,
  },
  {
    img: duplex,
    title: 'Smart 5BR Duplex',
    cat: 'Duplexes',
    beds: 5,
    baths: 6,
    sqm: 410,
    price: '₦135,000',
    build: '₦48M – ₦55M',
    badge: popular,
  },
  {
    img: bungalow,
    title: 'Compact 2BR Bungalow',
    cat: 'Bungalows',
    beds: 2,
    baths: 2,
    sqm: 120,
    price: '₦25,000',
    build: '₦9M – ₦12M',
    badge: bestFit,
  },
]

const filterChips = [
  'Any budget',
  '50×100 plot',
  '100×100 plot',
  '3+ bedrooms',
  'Modern style',
]

export function Marketplace() {
  const [active, setActive] = useState<(typeof categories)[number]>('All')
  const visible =
    active === 'All' ? plans : plans.filter((p) => p.cat === active)

  return (
    <section
      id="marketplace"
      className="relative overflow-hidden bg-muted/40 py-20 lg:py-28"
    >
      <div className="absolute inset-0 -z-10 blueprint-grid-fine blueprint-mask opacity-40" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
              Marketplace
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Featured building plans
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Explore architectural plans selected for Nigerian homes and
              projects.
            </p>
            <Link
              href="/plans"
              className="mt-6 inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Browse published plans →
            </Link>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActive(c)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                  active === c
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:text-foreground'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {filterChips.map((f) => (
            <span
              key={f}
              className="rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur"
            >
              {f}
            </span>
          ))}
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p, i) => (
            <article
              key={i}
              className="group overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-accent/40"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={p.img}
                  alt={p.title}
                  width={800}
                  height={600}
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-foreground backdrop-blur">
                  {p.cat}
                </div>
                <div className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground shadow-md">
                  <p.badge.icon className="h-3.5 w-3.5" />
                  {p.badge.label}
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-foreground">
                  {p.title}
                </h3>
                <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Bed className="h-4 w-4" /> {p.beds}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Bath className="h-4 w-4" /> {p.baths}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Maximize2 className="h-4 w-4" /> {p.sqm} m²
                  </span>
                </div>
                <div className="mt-4 rounded-lg bg-muted/60 px-3 py-2 text-xs">
                  <span className="text-muted-foreground">
                    Est. build cost ·{' '}
                  </span>
                  <span className="font-semibold text-foreground">
                    {p.build}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Plan price
                    </div>
                    <div className="text-xl font-bold text-foreground">
                      {p.price}
                    </div>
                  </div>
                  <a
                    href="#waitlist"
                    className="text-sm font-semibold text-accent hover:underline"
                  >
                    View plan →
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
