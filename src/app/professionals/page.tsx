import type { Metadata } from 'next'
import Link from 'next/link'
import { BadgeCheck } from 'lucide-react'
import { getPublishedProfessionals } from '@/lib/professionals'

function locationOf(profile: {
  city: string | null
  state: string | null
  country: string | null
}) {
  return [profile.city, profile.state, profile.country]
    .filter(Boolean)
    .join(', ')
}

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Architecture professionals | Archimart',
  description:
    'Browse published profiles of architects, builders, and other building professionals in Nigeria.',
}

export default async function ProfessionalsPage() {
  const profiles = await getPublishedProfessionals()
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
          Professional directory
        </p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Meet the people behind the work.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
          Explore profiles published by the Archimart team. A verified badge
          appears only after manual review.
        </p>
        <Link
          href="/professionals/apply"
          className="mt-7 inline-flex rounded-lg bg-navy px-5 py-3 text-sm font-semibold text-navy-foreground"
        >
          Apply for a listing →
        </Link>
        {profiles.length === 0 ? (
          <div className="mt-12 rounded-xl border border-dashed border-border bg-card p-10">
            <h2 className="text-xl font-semibold">Profiles are coming soon</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Our team is preparing the first professional listings.
            </p>
          </div>
        ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((profile) => (
              <article
                key={profile.id}
                className="rounded-xl border border-border bg-card p-6"
              >
                <div
                  aria-hidden="true"
                  className="grid h-14 w-14 place-items-center rounded-full bg-navy text-lg font-semibold text-gold"
                >
                  {profile.displayName.trim().charAt(0).toUpperCase()}
                </div>
                <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-gold">
                  {profile.specialty}
                </p>
                <h2 className="mt-2 text-xl font-semibold">
                  <Link
                    href={`/professionals/${profile.slug}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {profile.displayName}
                  </Link>
                </h2>
                {profile.headline && (
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {profile.headline}
                  </p>
                )}
                <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {locationOf(profile) && <span>{locationOf(profile)}</span>}
                  {profile.verificationStatus === 'verified' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gold-soft px-2.5 py-1 font-semibold text-gold-foreground">
                      <BadgeCheck className="h-3.5 w-3.5" /> Verified
                    </span>
                  )}
                </div>
                <Link
                  href={`/professionals/${profile.slug}`}
                  className="mt-6 inline-block text-sm font-semibold underline-offset-4 hover:underline"
                >
                  View profile →
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
