import type { Metadata } from 'next'
import Link from 'next/link'
import { BadgeCheck } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getPublishedProfessional } from '@/lib/professionals'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const profile = await getPublishedProfessional(slug)
  if (!profile) return { title: 'Professional not found | Archimart' }
  return {
    title: `${profile.displayName} | Archimart`,
    description: profile.headline ?? `${profile.specialty} on Archimart`,
  }
}

export default async function ProfessionalDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const profile = await getPublishedProfessional(slug)
  if (!profile) notFound()
  const location = [profile.city, profile.state, profile.country]
    .filter(Boolean)
    .join(', ')
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="text-lg font-extrabold">
            ARCHIMART<span className="text-gold">ng</span>
          </Link>
          <Link
            href="/professionals"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            All professionals
          </Link>
        </div>
      </header>
      <article className="mx-auto max-w-5xl px-5 pb-20 pt-10 sm:px-8">
        <Link
          href="/professionals"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Browse professionals
        </Link>
        <div className="mt-9 rounded-xl border border-border bg-card p-7 sm:p-10">
          <div
            aria-hidden="true"
            className="grid h-20 w-20 place-items-center rounded-full bg-navy text-3xl font-semibold text-gold"
          >
            {profile.displayName.trim().charAt(0).toUpperCase()}
          </div>
          <p className="mt-7 text-xs font-semibold uppercase tracking-[0.22em] text-gold">
            {profile.specialty}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            {profile.displayName}
          </h1>
          {profile.headline && (
            <p className="mt-4 max-w-2xl text-lg leading-7 text-muted-foreground">
              {profile.headline}
            </p>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {location && <span>{location}</span>}
            {profile.verificationStatus === 'verified' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-3 py-1 text-xs font-semibold text-gold-foreground">
                <BadgeCheck className="h-4 w-4" /> Manually verified
              </span>
            )}
          </div>
          <div className="mt-9 border-t border-border pt-8">
            <h2 className="text-xl font-semibold">About</h2>
            <p className="mt-4 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
              {profile.bio}
            </p>
          </div>
          <p className="mt-9 rounded-lg border border-border bg-muted/40 p-5 text-sm leading-6 text-muted-foreground">
            Enquiries for individual professionals will open when the client
            enquiry flow is ready.
          </p>
        </div>
      </article>
    </main>
  )
}
