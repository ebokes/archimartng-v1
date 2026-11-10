import Link from 'next/link'
import { PlanImage } from '@/components/plan-image'
import type { getPublishedPlans } from '@/lib/plans'

type Plan = Awaited<ReturnType<typeof getPublishedPlans>>[number]

export function Marketplace({ plans }: { plans: Plan[] }) {
  return (
    <section id="marketplace" className="bg-muted/40 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold">
              Architectural plans
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Recently published plans
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Explore plans selected by the Archimart team. Send an enquiry
              about a listing that interests you.
            </p>
          </div>
          <Link
            href="/plans"
            className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Browse all plans →
          </Link>
        </div>
        {plans.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-border bg-card p-8">
            <h3 className="text-xl font-semibold">Plans are coming soon</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              The Archimart team is preparing the first published listings.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.id}
                className="overflow-hidden rounded-xl border border-border bg-card"
              >
                <Link href={`/plans/${plan.slug}`} className="group block">
                  <div className="relative aspect-[4/3] bg-muted">
                    <PlanImage
                      src={plan.coverUrl}
                      alt={plan.coverAlt ?? plan.title}
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gold">
                      {plan.propertyType}
                    </p>
                    <h3 className="mt-3 text-xl font-semibold">{plan.title}</h3>
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
                    <span className="mt-5 inline-block text-sm font-semibold underline-offset-4 group-hover:underline">
                      View plan →
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
