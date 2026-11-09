import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AdminAccessError } from '@/lib/admin-authorization'
import { getAdminEnquiries } from '@/lib/enquiries'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Enquiries | Archimart',
  robots: { index: false, follow: false },
}

const dateFormatter = new Intl.DateTimeFormat('en-NG', {
  dateStyle: 'medium',
  timeZone: 'Africa/Lagos',
})

export default async function AdminEnquiriesPage() {
  let items: Awaited<ReturnType<typeof getAdminEnquiries>>
  try {
    items = await getAdminEnquiries()
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
        <h1 className="mt-8 text-3xl font-semibold">Client enquiries</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review messages, track status, and record manual follow-up.
        </p>
        {items.length === 0 ? (
          <p className="mt-8 rounded-xl border border-dashed border-border p-8 text-sm text-muted-foreground">
            No enquiries yet.
          </p>
        ) : (
          <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-5 last:border-b-0"
              >
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.planTitle ??
                      item.professionalName ??
                      'Listing enquiry'}{' '}
                    · {dateFormatter.format(item.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium capitalize">
                    {item.status.replace('_', ' ')}
                  </span>
                  <Link
                    href={`/admin/enquiries/${item.id}`}
                    className="text-sm font-semibold text-navy underline-offset-4 hover:underline dark:text-gold"
                  >
                    Review
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
