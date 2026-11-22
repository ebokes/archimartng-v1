import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { professionalOnboardingPageAccess } from '@/lib/professional-onboarding-page-access'
import { requireClientAccount } from '@/lib/require-marketplace-account'
import { ProfessionalOnboardingForm } from './onboarding-form'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Professional onboarding | Archimart',
  robots: { index: false, follow: false },
}

export default async function ProfessionalOnboardingPage() {
  const access = await professionalOnboardingPageAccess(requireClientAccount)
  if (access.status === 'sign-in') redirect('/account/sign-in')
  if (access.status === 'denied') notFound()

  return (
    <main className="min-h-screen bg-background px-5 py-16 text-foreground sm:px-8">
      <div className="mx-auto max-w-xl">
        <Link
          href="/account"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Your account
        </Link>
        <p className="mt-12 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Professional account
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-navy">
          Begin onboarding
        </h1>
        <div className="mt-8">
          <ProfessionalOnboardingForm />
        </div>
      </div>
    </main>
  )
}
