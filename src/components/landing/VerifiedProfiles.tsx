import Link from 'next/link'
import { BadgeCheck, ClipboardCheck, Users } from 'lucide-react'

export function VerifiedProfiles() {
  return (
    <section id="verified" className="bg-muted/40 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
            Professional profiles
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground md:text-5xl">
            See the status behind each profile.
          </h2>
          <p className="mt-5 text-base leading-7 text-muted-foreground md:text-lg">
            Archimart publishes professional listings through its administrator
            team. A verified badge appears only when manual review has been
            completed.
          </p>
          <Link
            href="/professionals"
            className="mt-7 inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Explore published profiles →
          </Link>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            {
              icon: Users,
              title: 'Published profiles',
              text: 'Browse professionals whose listings are ready for public review.',
            },
            {
              icon: ClipboardCheck,
              title: 'Manual review',
              text: 'Verification is recorded separately from publication status.',
            },
            {
              icon: BadgeCheck,
              title: 'Clear verification',
              text: 'Look for the verified badge when review has been completed.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-border bg-card p-6"
            >
              <item.icon className="h-6 w-6 text-gold" aria-hidden="true" />
              <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
