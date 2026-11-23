import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ClientSignOutButton } from '@/app/account/sign-out-button'
import { professionalStatusPageAccess } from '@/lib/professional-onboarding-page-access'
import { getOwnProfessionalOnboardingStatus } from '@/lib/professional-onboarding-server'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Professional approval status | Archimart',
  robots: { index: false, follow: false },
}

const statusContent = {
  pending: {
    title: 'Pending administrator review',
    detail: 'Your professional account is awaiting a manual decision.',
  },
  rejected: {
    title: 'Not approved',
    detail:
      'Your professional account was not approved. Contact Archimart if you need to discuss this decision.',
  },
  approved: {
    title: 'Approved',
    detail:
      'Your professional account was approved. Profile ownership, publication, and verification are separate administrator decisions.',
  },
} as const

export default async function ProfessionalStatusPage() {
  const access = await professionalStatusPageAccess(
    getOwnProfessionalOnboardingStatus,
  )
  if (access.status !== 'allowed') {
    if (access.status === 'sign-in') redirect('/account/professional/sign-in')
    notFound()
  }

  const content = statusContent[access.value.approvalStatus]
  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between gap-4 border-b border-border pb-5">
          <Link href="/" className="text-lg font-extrabold tracking-tight">
            ARCHIMART<span className="text-gold">ng</span>
          </Link>
          <ClientSignOutButton destination="/account/professional/sign-in" />
        </header>
        <section className="py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Your professional account
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-navy">
            {content.title}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
            {content.detail}
          </p>
          {access.value.approvalStatus === 'approved' && (
            <Link
              href="/account/professional/profile"
              className="mt-6 inline-block rounded-lg border border-border px-5 py-3 text-sm font-semibold"
            >
              View your profile
            </Link>
          )}
        </section>
      </div>
    </main>
  )
}
