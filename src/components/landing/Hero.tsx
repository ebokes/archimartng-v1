import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BadgeCheck, ClipboardList } from 'lucide-react'
import heroImage from '@/assets/hero-building.jpg'

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      <div
        className="absolute inset-0 -z-10"
        style={{ background: 'var(--gradient-hero)' }}
      />
      <div className="absolute inset-0 -z-10 blueprint-grid blueprint-mask opacity-60" />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            Plans and professionals in Nigeria
          </p>
          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Explore plans. Find professionals.{' '}
            <span className="gold-text-gradient">Start a conversation.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
            Browse architectural plans and professional profiles managed by the
            Archimart team. Ask about a listing and we will review your enquiry
            manually.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/plans"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-semibold text-accent-foreground hover:opacity-90"
            >
              Browse plans <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/professionals"
              className="rounded-lg border border-border bg-background px-6 py-3 font-semibold hover:bg-muted"
            >
              Browse professionals
            </Link>
          </div>
          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-gold" /> Admin-managed
              listings
            </span>
            <span className="inline-flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-gold" /> Clear manual
              verification status
            </span>
          </div>
        </div>
        <div
          className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border bg-muted"
          style={{ boxShadow: 'var(--shadow-luxury)' }}
        >
          <Image
            src={heroImage}
            alt="Contemporary building exterior"
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  )
}
