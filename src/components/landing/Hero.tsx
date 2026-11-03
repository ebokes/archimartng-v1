import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Brain,
  BadgeCheck,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import heroImage from '@/assets/hero-building.jpg'
import Image from 'next/image'

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28">
      <div
        className="absolute inset-0 -z-10"
        style={{ background: 'var(--gradient-hero)' }}
      />
      <div className="absolute inset-0 -z-10 blueprint-grid blueprint-mask opacity-60" />

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="rise-in">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Africa's premium construction-tech platform
          </div>

          <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-[3.75rem]">
            Buy Architectural Designs.{' '}
            <span className="gold-text-gradient">
              Hire Trusted Professionals.
            </span>{' '}
            Build Smarter.
          </h1>

          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Purchase ready-to-build house plans or hire verified architects and
            construction professionals securely — all in one intelligent
            platform.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 bg-accent px-6 text-base font-semibold text-accent-foreground hover:bg-accent/90"
              style={{ boxShadow: 'var(--shadow-gold)' }}
            >
              <a href="#marketplace">
                Find My Perfect Plan <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 px-6 text-base font-semibold"
            >
              <a href="#professionals">Browse Verified Professionals</a>
            </Button>
          </div>

          <ul className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-accent" /> KYC Verified
              Professionals
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-accent" /> Escrow-Protected
              Payments
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-accent" /> Secure
              Transactions
            </li>
          </ul>
        </div>

        <div className="relative">
          <div
            className="relative overflow-hidden rounded-3xl border border-border"
            style={{ boxShadow: 'var(--shadow-luxury)' }}
          >
            <Image
              src={heroImage}
              alt="Luxury modern architectural building with blueprint overlays"
              width={1280}
              height={1280}
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-[oklch(0.21_0.04_264/0.55)] via-transparent to-transparent" />
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full opacity-30 mix-blend-screen"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern
                  id="grid"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="oklch(0.85 0.12 85)"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Corner blueprint marks */}
            <div className="pointer-events-none absolute left-4 top-4 h-6 w-6 border-l-2 border-t-2 border-accent/80" />
            <div className="pointer-events-none absolute right-4 top-4 h-6 w-6 border-r-2 border-t-2 border-accent/80" />
            <div className="pointer-events-none absolute left-4 bottom-4 h-6 w-6 border-l-2 border-b-2 border-accent/80" />
            <div className="pointer-events-none absolute right-4 bottom-4 h-6 w-6 border-r-2 border-b-2 border-accent/80" />
          </div>

          {/* Floating trust cards */}
          <div
            className="absolute -left-4 top-6 hidden w-56 rounded-2xl border border-border bg-background/95 p-4 backdrop-blur sm:block float-slow"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-accent">
              <Brain className="h-4 w-4" /> AI Cost Estimate
            </div>
            <div className="mt-1 text-lg font-bold text-foreground">
              ₦38M – ₦42M
            </div>
            <div className="text-[11px] text-muted-foreground">
              4BR Duplex · Lagos
            </div>
          </div>

          <div
            className="absolute -right-4 top-1/2 hidden w-52 -translate-y-1/2 rounded-2xl border border-border bg-background/95 p-4 backdrop-blur sm:block"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-accent">
              <BadgeCheck className="h-4 w-4" /> Verified Architect
            </div>
            <div className="mt-1 text-sm font-semibold text-foreground">
              KYC Approved
            </div>
            <div className="text-[11px] text-muted-foreground">
              ID + credentials checked
            </div>
          </div>

          <div
            className="absolute -bottom-6 left-1/2 hidden w-60 -translate-x-1/2 rounded-2xl border border-border bg-background/95 p-4 backdrop-blur sm:block float-slow"
            style={{ boxShadow: 'var(--shadow-gold)' }}
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-accent">
              <Lock className="h-4 w-4" /> Escrow Protected
            </div>
            <div className="mt-1 text-sm font-semibold text-foreground">
              Milestone-secured payments
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
