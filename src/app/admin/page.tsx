import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { SignOutButton } from './sign-out-button'
import { AdminAccessError } from '@/lib/admin-authorization'
import { requireAdmin } from '@/lib/require-admin'

export const metadata: Metadata = {
  title: 'Admin workspace | Archimart',
  robots: { index: false, follow: false },
}

export default async function AdminPage() {
  let admin: Awaited<ReturnType<typeof requireAdmin>>
  try {
    admin = await requireAdmin()
  } catch (error) {
    if (error instanceof AdminAccessError) redirect('/admin/sign-in')
    throw error
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-5">
          <Link
            href="/"
            className="text-lg font-extrabold tracking-tight text-navy"
          >
            ARCHIMART<span className="text-gold">ng</span>
          </Link>
          <SignOutButton />
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-6 py-20">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Admin workspace
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
          Welcome, {admin.name}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
          Your administrator access is active. Listings and enquiries will be
          managed here.
        </p>
      </section>
    </main>
  )
}
