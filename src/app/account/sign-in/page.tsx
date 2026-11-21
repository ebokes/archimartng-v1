import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isClientSessionAdmissionEnabled } from '@/lib/client-session-admission'
import { ClientSignInForm } from './sign-in-form'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Client sign in | Archimart',
  robots: { index: false, follow: false },
}

export default function ClientSignInPage() {
  if (!isClientSessionAdmissionEnabled(process.env)) notFound()
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
        <h1 className="mt-3 text-3xl font-semibold text-navy">Sign in</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Verify your email before signing in. Only active client accounts can
          open the dashboard.
        </p>
        <ClientSignInForm />
        <p className="mt-7 text-sm text-muted-foreground">
          New here?{' '}
          <Link href="/account/register" className="font-medium underline">
            Create a client account
          </Link>
          .
        </p>
      </div>
    </main>
  )
}
