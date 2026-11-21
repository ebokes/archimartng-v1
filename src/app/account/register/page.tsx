import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isLocalClientRegistrationAvailable } from '@/lib/client-registration-gate'
import { RegistrationForm } from './registration-form'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Client registration | Archimart',
  robots: { index: false, follow: false },
}

export default function ClientRegistrationPage() {
  if (
    !isLocalClientRegistrationAvailable() ||
    process.env.ACCOUNT_RATE_LIMIT_ENABLED !== 'true'
  )
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
        <p className="mt-12 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Client account
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-navy">
          Create your account
        </h1>
        <p className="mt-3 mb-8 text-sm leading-6 text-muted-foreground">
          Enter your details to request a client account. You’ll need to verify
          your email before signing in.
        </p>
        <RegistrationForm />
      </div>
    </main>
  )
}
