import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AdminAccessError } from '@/lib/admin-authorization'
import { getAdminApplications } from '@/lib/professional-applications'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Professional applications | Archimart',
  robots: { index: false, follow: false },
}

const dateFormatter = new Intl.DateTimeFormat('en-NG', {
  dateStyle: 'medium',
  timeZone: 'Africa/Lagos',
})

export default async function AdminApplicationsPage() {
  let applications: Awaited<ReturnType<typeof getAdminApplications>>
  try {
    applications = await getAdminApplications()
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
          Professional applications
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review submissions and record your follow-up manually.
        </p>
        {applications.length === 0 ? (
          <p className="mt-8 rounded-xl border border-dashed border-border p-8 text-sm text-muted-foreground">
            No applications yet.
          </p>
        ) : (
          <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card">
            {applications.map((application) => (
              <div
                key={application.id}
                className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-5 last:border-b-0"
              >
                <div>
                  <p className="font-semibold">{application.applicantName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {application.specialty} ·{' '}
                    {dateFormatter.format(application.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium capitalize">
                    {application.status.replace('_', ' ')}
                  </span>
                  <Link
                    href={`/admin/applications/${application.id}`}
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
