import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ClientSignOutButton } from '@/app/account/sign-out-button'
import { MarketplaceAccountAccessError } from '@/lib/marketplace-account-authorization'
import { getOwnProfessionalProfile } from '@/lib/own-professional-profile'
import { ProfessionalProfileEditForm } from './profile-edit-form'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Your professional profile | Archimart',
  robots: { index: false, follow: false },
}

const publicationLabels = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
} as const
const verificationLabels = {
  unverified: 'Not verified',
  verified: 'Verified',
  rejected: 'Verification rejected',
} as const

export default async function OwnProfessionalProfilePage() {
  let profile
  try {
    profile = await getOwnProfessionalProfile()
  } catch (error) {
    if (error instanceof MarketplaceAccountAccessError) {
      if (error.status === 401) redirect('/account/professional/sign-in')
      notFound()
    }
    throw error
  }

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between gap-4 border-b border-border pb-5">
          <Link href="/" className="text-lg font-extrabold tracking-tight">
            ARCHIMART<span className="text-gold">ng</span>
          </Link>
          <ClientSignOutButton destination="/account/professional/sign-in" />
        </header>
        <section className="py-10">
          <Link
            href="/account/professional/status"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Approval status
          </Link>
          <p className="mt-10 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Private professional account
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-navy">
            Your profile
          </h1>
          {!profile ? (
            <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground">
              No profile is linked to your account yet. An administrator must
              review and approve any profile association.
            </p>
          ) : (
            <div className="mt-8 space-y-7">
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="rounded-full border border-border px-3 py-1">
                  {publicationLabels[profile.publicationStatus]}
                </span>
                <span className="rounded-full border border-border px-3 py-1">
                  {verificationLabels[profile.verificationStatus]}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-navy">
                  {profile.displayName}
                </h2>
                {profile.headline && (
                  <p className="mt-2 text-muted-foreground">
                    {profile.headline}
                  </p>
                )}
              </div>
              <dl className="grid gap-5 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-semibold text-navy">Specialty</dt>
                  <dd className="mt-1 text-muted-foreground">
                    {profile.specialty}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-navy">Location</dt>
                  <dd className="mt-1 text-muted-foreground">
                    {[profile.city, profile.state, profile.country]
                      .filter(Boolean)
                      .join(', ') || 'Not provided'}
                  </dd>
                </div>
                {profile.websiteUrl && (
                  <div>
                    <dt className="font-semibold text-navy">Website</dt>
                    <dd className="mt-1 break-all text-muted-foreground">
                      {profile.websiteUrl}
                    </dd>
                  </div>
                )}
              </dl>
              <div>
                <h3 className="font-semibold text-navy">Biography</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                  {profile.bio}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Profile publication and verification remain administrator
                decisions.
              </p>
              <ProfessionalProfileEditForm
                initialValues={{
                  bio: profile.bio,
                  websiteUrl: profile.websiteUrl ?? '',
                  city: profile.city ?? '',
                  state: profile.state ?? '',
                  country: profile.country ?? '',
                }}
              />
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
