import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getPublishedPlans } from '@/lib/plans'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Architectural plans | Archimart',
  description:
    'Browse published architectural plans for Nigerian homes and projects.',
}

export default async function PlansPage() {
  const plans = await getPublishedPlans()
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="text-lg font-extrabold">
            ARCHIMART<span className="text-gold">ng</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Home
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-5 pb-20 pt-12 sm:px-8 sm:pt-16">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
          Plan catalogue
        </p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Find a plan for what comes next.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
          Explore architectural plans selected by the Archimart team. Listing
          details are provided for your initial review.
        </p>
        {plans.length === 0 ? (
          <div className="mt-12 rounded-xl border border-dashed border-border bg-card p-10">
            <h2 className="text-xl font-semibold">Plans are coming soon</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Our team is preparing the first published listings.
            </p>
          </div>
        ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.id}
                className="overflow-hidden rounded-xl border border-border bg-card"
              >
                <Link href={`/plans/${plan.slug}`} className="group block">
                  <div className="relative aspect-[4/3] bg-muted">
                    {plan.coverUrl ? (
                      <Image
                        unoptimized
                        src={plan.coverUrl}
                        alt={plan.coverAlt ?? plan.title}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-sm text-muted-foreground">
                        Image pending
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gold">
                      {plan.propertyType}
                    </p>
                    <h2 className="mt-3 text-xl font-semibold">{plan.title}</h2>
                    {plan.summary && (
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                        {plan.summary}
                      </p>
                    )}
                    <p className="mt-5 text-xs text-muted-foreground">
                      {[
                        plan.bedrooms != null
                          ? `${plan.bedrooms} bedrooms`
                          : null,
                        plan.bathrooms != null
                          ? `${plan.bathrooms} bathrooms`
                          : null,
                        plan.floorAreaSqm
                          ? `${Number(plan.floorAreaSqm).toLocaleString('en-NG')} m² floor area`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    <span className="mt-5 inline-block text-sm font-semibold text-foreground underline-offset-4 group-hover:underline">
                      View plan →
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
