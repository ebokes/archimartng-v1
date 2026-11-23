import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { AdminAccessError } from '@/lib/admin-authorization'
import {
  getAdminMarketplaceAccount,
  isLocalAccountStatusManagementEnabled,
} from '@/lib/admin-marketplace-accounts'
import { saveMarketplaceAccountStatus } from '../actions'
import { MarketplaceAccountStatusForm } from '../status-form'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Manage marketplace account | Archimart',
  robots: { index: false, follow: false },
}
const dateFormatter = new Intl.DateTimeFormat('en-NG', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Africa/Lagos',
})

export default async function MarketplaceAccountPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  if (!isLocalAccountStatusManagementEnabled()) notFound()
  const { id } = await params
  let account: Awaited<ReturnType<typeof getAdminMarketplaceAccount>>
  try {
    account = await getAdminMarketplaceAccount(id)
  } catch (error) {
    if (error instanceof AdminAccessError) redirect('/admin/sign-in')
    throw error
  }
  if (!account) notFound()
  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/admin/marketplace-accounts"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Marketplace accounts
        </Link>
        <h1 className="mt-8 text-3xl font-semibold">{account.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{account.email}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {account.role} · {account.status}
          {account.approvalStatus
            ? ` · ${account.approvalStatus} approval`
            : ''}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Status changes do not change role, professional approval, profile
          ownership, publication, or verification.
        </p>
        {account.status === 'closed' ? (
          <p className="mt-8 rounded-xl border border-border bg-card p-6 text-sm">
            Closed accounts cannot be restored here.
          </p>
        ) : (
          <MarketplaceAccountStatusForm
            key={account.status}
            status={account.status}
            action={saveMarketplaceAccountStatus.bind(null, account.id)}
          />
        )}
        <section className="mt-8 rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold">Restricted status history</h2>
          {account.events.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No status events recorded.
            </p>
          ) : (
            <ol className="mt-4 space-y-5">
              {account.events.map((event) => (
                <li
                  key={event.id}
                  className="border-t border-border pt-4 text-sm"
                >
                  <p className="font-semibold">
                    {event.action === 'account_suspended'
                      ? 'Suspended'
                      : 'Restored'}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {dateFormatter.format(event.createdAt)} · {event.actorName}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap">{event.reason}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </main>
  )
}
