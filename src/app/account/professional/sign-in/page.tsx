import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ClientSignInForm } from '@/app/account/sign-in/sign-in-form'
import { isDisposableProfessionalStatusPageEnabled } from '@/lib/professional-onboarding-gate'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Professional sign in | Archimart',
  robots: { index: false, follow: false },
}

export default function ProfessionalSignInPage() {
  if (!isDisposableProfessionalStatusPageEnabled()) notFound()
  return (
    <main className="min-h-screen bg-background px-5 py-16 text-foreground sm:px-8">
      <div className="mx-auto max-w-md">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Archimart
        </Link>
        <p className="mt-12 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Professional account
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-navy">Sign in</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Sign in to see your professional approval status.
        </p>
        <ClientSignInForm destination="/account/professional/status" />
      </div>
    </main>
  )
}
