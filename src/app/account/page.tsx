import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { clientPageAccess } from '@/lib/client-page-access'
import { mayStartDisposableProfessionalOnboarding } from '@/lib/professional-onboarding-gate'
import { requireClientAccount } from '@/lib/require-marketplace-account'
import { ClientSignOutButton } from './sign-out-button'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Client dashboard | Archimart',
  robots: { index: false, follow: false },
}

export default async function ClientDashboard() {
  const access = await clientPageAccess(requireClientAccount)
  if (access.status !== 'allowed') {
    if (access.status === 'sign-in') redirect('/account/sign-in')
    notFound()
  }

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between gap-4 border-b border-border pb-5">
          <Link href="/" className="text-lg font-extrabold tracking-tight">
            ARCHIMART<span className="text-gold">ng</span>
          </Link>
          <ClientSignOutButton />
        </header>
        <section className="py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Client account
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-navy">
            Your dashboard
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
            Your account is ready. Browse published plans and professionals to
            explore Archimart.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/plans"
              className="rounded-lg bg-navy px-5 py-3 text-sm font-semibold text-white"
            >
              Browse plans
            </Link>
            {mayStartDisposableProfessionalOnboarding(
              access.account.authSubject,
            ) && (
              <Link
                href="/account/professional/onboard"
                className="rounded-lg border border-border px-5 py-3 text-sm font-semibold"
              >
                Begin professional onboarding
              </Link>
            )}
            <Link
              href="/professionals"
              className="rounded-lg border border-border px-5 py-3 text-sm font-semibold"
            >
              Browse professionals
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
