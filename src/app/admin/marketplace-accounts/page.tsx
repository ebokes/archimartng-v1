import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { AdminAccessError } from '@/lib/admin-authorization'
import {
  isLocalAccountStatusManagementEnabled,
  listAdminMarketplaceAccounts,
} from '@/lib/admin-marketplace-accounts'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Marketplace accounts | Archimart',
  robots: { index: false, follow: false },
}

export default async function MarketplaceAccountsPage() {
  if (!isLocalAccountStatusManagementEnabled()) notFound()
  let accounts: Awaited<ReturnType<typeof listAdminMarketplaceAccounts>>
  try {
    accounts = await listAdminMarketplaceAccounts()
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
          Marketplace account status
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Latest 50 client and professional accounts. Status reasons are visible
          only on each account’s private review page.
        </p>
        {accounts.length === 0 ? (
          <p className="mt-8 rounded-xl border border-dashed border-border p-8 text-sm text-muted-foreground">
            No marketplace accounts.
          </p>
        ) : (
          <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-5 last:border-b-0"
              >
                <div>
                  <p className="font-semibold">{account.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {account.email}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {account.role} · {account.status}
                    {account.approvalStatus
                      ? ` · ${account.approvalStatus} approval`
                      : ''}
                  </p>
                </div>
                <Link
                  href={`/admin/marketplace-accounts/${account.id}`}
                  className="text-sm font-semibold text-navy underline-offset-4 hover:underline dark:text-gold"
                >
                  Manage →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
