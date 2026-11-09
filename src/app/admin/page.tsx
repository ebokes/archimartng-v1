import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AdminAccessError } from '@/lib/admin-authorization'
import { getAdminDashboard } from '@/lib/admin-dashboard'
import { SignOutButton } from './sign-out-button'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Admin dashboard | Archimart',
  robots: { index: false, follow: false },
}

const dateFormatter = new Intl.DateTimeFormat('en-NG', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Africa/Lagos',
})

const enquiryStatusLabel = {
  new: 'New',
  in_progress: 'In progress',
  closed: 'Closed',
  spam: 'Spam',
} as const

const applicationStatusLabel = {
  submitted: 'Submitted',
  under_review: 'Under review',
  approved: 'Approved',
  rejected: 'Rejected',
} as const

export default async function AdminPage() {
  let dashboard: Awaited<ReturnType<typeof getAdminDashboard>>
  try {
    dashboard = await getAdminDashboard()
  } catch (error) {
    if (error instanceof AdminAccessError) redirect('/admin/sign-in')
    throw error
  }

  const { admin, counts, recentEnquiries, recentApplications } = dashboard
  const metrics = [
    {
      label: 'New enquiries',
      value: counts.enquiries?.new ?? 0,
      detail: `${counts.enquiries?.inProgress ?? 0} in progress`,
      emphasis: true,
    },
    {
      label: 'Applications to review',
      value:
        (counts.applications?.submitted ?? 0) +
        (counts.applications?.underReview ?? 0),
      detail: `${counts.applications?.submitted ?? 0} newly submitted`,
    },
    {
      label: 'Published plans',
      value: counts.plans?.published ?? 0,
      detail: `${counts.plans?.draft ?? 0} drafts`,
    },
    {
      label: 'Published professionals',
      value: counts.professionals?.published ?? 0,
      detail: `${counts.professionals?.verified ?? 0} verified · ${counts.professionals?.draft ?? 0} drafts`,
    },
  ]

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link
            href="/"
            className="text-lg font-extrabold tracking-tight text-foreground"
          >
            ARCHIMART<span className="text-gold">ng</span>
          </Link>
          <SignOutButton />
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 pb-20 pt-10 sm:px-8 sm:pt-14">
        <div className="flex flex-wrap items-end justify-between gap-5 border-b border-border pb-9">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Admin dashboard
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Workspace overview
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Welcome, {admin.name}. Here is what needs your attention.
            </p>
          </div>
          <p className="border-l-2 border-gold pl-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Live from Archimart
          </p>
        </div>

        <section
          aria-label="Marketplace overview"
          className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className={`rounded-xl border p-6 ${metric.emphasis ? 'border-navy bg-navy text-navy-foreground' : 'border-border bg-card'}`}
            >
              <p
                className={`text-xs font-semibold uppercase tracking-[0.16em] ${metric.emphasis ? 'text-navy-foreground/70' : 'text-muted-foreground'}`}
              >
                {metric.label}
              </p>
              <p
                className={`mt-7 text-4xl font-semibold tabular-nums ${metric.emphasis ? 'text-gold' : 'text-foreground'}`}
              >
                {metric.value}
              </p>
              <p
                className={`mt-2 text-sm ${metric.emphasis ? 'text-navy-foreground/70' : 'text-muted-foreground'}`}
              >
                {metric.detail}
              </p>
            </div>
          ))}
        </section>

        <div className="mt-8">
          <Link
            href="/admin/enquiries"
            className="mr-3 inline-flex rounded-lg border border-border px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted"
          >
            Manage enquiries →
          </Link>
          <Link
            href="/admin/plans"
            className="inline-flex rounded-lg bg-navy px-5 py-3 text-sm font-semibold text-navy-foreground hover:opacity-90"
          >
            Manage plans →
          </Link>
          <Link
            href="/admin/professionals"
            className="ml-3 inline-flex rounded-lg border border-border px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted"
          >
            Manage professionals →
          </Link>
          <Link
            href="/admin/applications"
            className="ml-3 inline-flex rounded-lg border border-border px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted"
          >
            Review applications →
          </Link>
        </div>

        <div className="mt-12 grid gap-10 xl:grid-cols-2">
          <section aria-labelledby="recent-enquiries-heading">
            <div className="mb-5 flex items-baseline justify-between gap-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gold">
                  Client activity
                </p>
                <h2
                  id="recent-enquiries-heading"
                  className="text-xl font-semibold tracking-tight text-foreground"
                >
                  Enquiries to follow up
                </h2>
              </div>
              <span className="text-xs text-muted-foreground">Latest five</span>
            </div>
            {recentEnquiries.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-8 text-sm leading-6 text-muted-foreground">
                No enquiries need follow-up right now.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                {recentEnquiries.map((enquiry) => (
                  <article
                    key={enquiry.id}
                    className="border-b border-border p-5 last:border-b-0"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {enquiry.name}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {enquiry.planTitle ??
                            enquiry.professionalName ??
                            'Listing enquiry'}
                        </p>
                      </div>
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                        {enquiryStatusLabel[enquiry.status]}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <time dateTime={enquiry.createdAt.toISOString()}>
                        {dateFormatter.format(enquiry.createdAt)}
                      </time>
                      <a
                        href={`mailto:${enquiry.email}`}
                        className="underline-offset-2 hover:underline"
                      >
                        {enquiry.email}
                      </a>
                      {enquiry.phone ? <span>{enquiry.phone}</span> : null}
                    </div>
                    <details className="mt-4 text-sm">
                      <summary className="w-fit cursor-pointer font-medium text-foreground hover:underline">
                        Read message
                      </summary>
                      <p className="mt-3 whitespace-pre-wrap leading-6 text-muted-foreground">
                        {enquiry.message}
                      </p>
                    </details>
                    <Link
                      href={`/admin/enquiries/${enquiry.id}`}
                      className="mt-4 inline-block text-sm font-semibold text-navy underline-offset-4 hover:underline dark:text-gold"
                    >
                      Review enquiry →
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="recent-applications-heading">
            <div className="mb-5 flex items-baseline justify-between gap-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gold">
                  Professional interest
                </p>
                <h2
                  id="recent-applications-heading"
                  className="text-xl font-semibold tracking-tight text-foreground"
                >
                  Applications to review
                </h2>
              </div>
              <span className="text-xs text-muted-foreground">Latest five</span>
            </div>
            {recentApplications.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-8 text-sm leading-6 text-muted-foreground">
                No applications are waiting for review.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                {recentApplications.map((application) => (
                  <article
                    key={application.id}
                    className="border-b border-border p-5 last:border-b-0"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {application.applicantName}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {application.businessName
                            ? `${application.businessName} · ${application.specialty}`
                            : application.specialty}
                        </p>
                      </div>
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                        {applicationStatusLabel[application.status]}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <time dateTime={application.createdAt.toISOString()}>
                        {dateFormatter.format(application.createdAt)}
                      </time>
                      <a
                        href={`mailto:${application.email}`}
                        className="underline-offset-2 hover:underline"
                      >
                        {application.email}
                      </a>
                      {application.phone ? (
                        <span>{application.phone}</span>
                      ) : null}
                    </div>
                    <details className="mt-4 text-sm">
                      <summary className="w-fit cursor-pointer font-medium text-foreground hover:underline">
                        Read application
                      </summary>
                      <p className="mt-3 whitespace-pre-wrap leading-6 text-muted-foreground">
                        {application.message}
                      </p>
                    </details>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
