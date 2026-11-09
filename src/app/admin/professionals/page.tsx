import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AdminAccessError } from '@/lib/admin-authorization'
import { getAdminProfessionals } from '@/lib/professionals'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Manage professionals | Archimart',
  robots: { index: false, follow: false },
}

export default async function AdminProfessionalsPage() {
  let rows: Awaited<ReturnType<typeof getAdminProfessionals>>
  try {
    rows = await getAdminProfessionals()
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
        <div className="mt-8 flex flex-wrap items-end justify-between gap-5 border-b border-border pb-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gold">
              Admin workspace
            </p>
            <h1 className="mt-3 text-3xl font-semibold">Professionals</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage publication and manual verification separately.
            </p>
          </div>
          <Link
            href="/admin/professionals/new"
            className="rounded-lg bg-navy px-5 py-3 text-sm font-semibold text-navy-foreground"
          >
            Add professional
          </Link>
        </div>
        {rows.length === 0 ? (
          <p className="mt-8 rounded-xl border border-dashed border-border p-8 text-sm text-muted-foreground">
            No profiles yet. Add a draft to begin.
          </p>
        ) : (
          <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card">
            {rows.map((row) => (
              <div
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-5 last:border-b-0"
              >
                <div>
                  <p className="font-semibold">{row.displayName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {row.specialty} · {row.slug}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium capitalize">
                    {row.publicationStatus}
                  </span>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium capitalize">
                    {row.verificationStatus}
                  </span>
                  <Link
                    href={`/admin/professionals/${row.id}/edit`}
                    className="text-sm font-semibold text-navy underline-offset-4 hover:underline dark:text-gold"
                  >
                    Edit
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
