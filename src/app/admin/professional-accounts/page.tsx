import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { AdminAccessError } from '@/lib/admin-authorization'
import {
  getAdminProfessionalAccounts,
  isLocalProfessionalAccountReviewEnabled,
} from '@/lib/admin-professional-accounts'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Professional account review | Archimart',
  robots: { index: false, follow: false },
}

export default async function ProfessionalAccountsPage() {
  if (!isLocalProfessionalAccountReviewEnabled()) notFound()
  let accounts: Awaited<ReturnType<typeof getAdminProfessionalAccounts>>
  try {
    accounts = await getAdminProfessionalAccounts()
  } catch (error) {
    if (error instanceof AdminAccessError) redirect('/admin/sign-in')
    throw error
  }
  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/admin"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Dashboard
        </Link>
        <h1 className="mt-8 text-3xl font-semibold">
          Professional account review
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pending and rejected accounts. This queue is separate from public
          professional applications and profiles.
        </p>
        {accounts.length === 0 ? (
          <p className="mt-8 rounded-xl border border-dashed border-border p-8 text-sm text-muted-foreground">
            No accounts awaiting review.
          </p>
        ) : (
          <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card">
            {accounts.map((account) => (
              <div
                key={account.accountId}
                className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-5 last:border-b-0"
              >
                <div>
                  <p className="font-semibold">{account.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {account.email} · {account.approvalStatus}
                  </p>
                </div>
                <Link
                  href={`/admin/professional-accounts/${account.accountId}`}
                  className="text-sm font-semibold text-navy underline-offset-4 hover:underline dark:text-gold"
                >
                  Review →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
