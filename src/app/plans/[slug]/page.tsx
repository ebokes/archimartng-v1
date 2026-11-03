import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPublishedPlan } from '@/lib/plans'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const plan = await getPublishedPlan(slug)
  if (!plan) return { title: 'Plan not found | Archimart' }
  return {
    title: `${plan.title} | Archimart`,
    description: plan.summary ?? undefined,
  }
}

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const plan = await getPublishedPlan(slug)
  if (!plan) notFound()
  const cover = plan.images.find((image) => image.isCover) ?? plan.images[0]
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="text-lg font-extrabold">
            ARCHIMART<span className="text-gold">ng</span>
          </Link>
          <Link
            href="/plans"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            All plans
          </Link>
        </div>
      </header>
      <article className="mx-auto max-w-6xl px-5 pb-20 pt-10 sm:px-8">
        <Link
          href="/plans"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Browse plans
        </Link>
        <div className="mt-8 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
              {cover ? (
                <Image
                  unoptimized
                  src={cover.imageUrl}
                  alt={cover.altText}
                  fill
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  className="object-cover"
                />
              ) : (
                <div className="grid h-full place-items-center text-muted-foreground">
                  Image pending
                </div>
              )}
            </div>
            {plan.images.length > 1 && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                {plan.images
                  .filter((image) => image.id !== cover?.id)
                  .map((image) => (
                    <div
                      key={image.id}
                      className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted"
                    >
                      <Image
                        unoptimized
                        src={image.imageUrl}
                        alt={image.altText}
                        fill
                        sizes="(min-width: 1024px) 25vw, 50vw"
                        className="object-cover"
                      />
                    </div>
                  ))}
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
              {plan.propertyType}
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight">
              {plan.title}
            </h1>
            {plan.summary && (
              <p className="mt-5 text-lg leading-7 text-muted-foreground">
                {plan.summary}
              </p>
            )}
            <dl className="mt-8 grid grid-cols-2 gap-4 border-y border-border py-6 text-sm">
              {[
                ['Bedrooms', plan.bedrooms],
                ['Bathrooms', plan.bathrooms],
                ['Floors', plan.floors],
                [
                  'Plot area',
                  plan.plotAreaSqm
                    ? `${Number(plan.plotAreaSqm).toLocaleString('en-NG')} m²`
                    : null,
                ],
                [
                  'Floor area',
                  plan.floorAreaSqm
                    ? `${Number(plan.floorAreaSqm).toLocaleString('en-NG')} m²`
                    : null,
                ],
              ]
                .filter((item) => item[1] != null)
                .map(([name, value]) => (
                  <div key={name}>
                    <dt className="text-muted-foreground">{name}</dt>
                    <dd className="mt-1 font-semibold">{value}</dd>
                  </div>
                ))}
            </dl>
            <h2 className="mt-9 text-xl font-semibold">About this plan</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
              {plan.description}
            </p>
            <p className="mt-9 rounded-lg border border-border bg-muted/40 p-5 text-sm leading-6 text-muted-foreground">
              Enquiries for individual plans will open when the client enquiry
              flow is ready.
            </p>
          </div>
        </div>
      </article>
    </main>
  )
}
