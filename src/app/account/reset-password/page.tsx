import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isLocalClientRegistrationAvailable } from '@/lib/client-registration-gate'
import { isAccountRateLimitReady } from '@/lib/account-rate-limit-store'
import { PasswordResetForm } from './password-reset-form'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Reset password | Archimart',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

export default function PasswordResetPage() {
  if (!isLocalClientRegistrationAvailable() || !isAccountRateLimitReady())
    notFound()
  return (
    <main className="min-h-screen bg-background px-5 py-16 text-foreground sm:px-8">
      <div className="mx-auto max-w-md">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Archimart
        </Link>
        <h1 className="mt-12 text-3xl font-semibold text-navy">
          Set a new password
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Use the link from your account recovery email. This page will not sign
          you in automatically.
        </p>
        <PasswordResetForm />
      </div>
    </main>
  )
}
