import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { AdminAccessError } from '@/lib/admin-authorization'
import { getAdminApplication } from '@/lib/professional-applications'
import { reviewProfessionalApplication } from '../actions'
import { ReviewForm } from '../review-form'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Review application | Archimart',
  robots: { index: false, follow: false },
}

export default async function ApplicationReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  let application: Awaited<ReturnType<typeof getAdminApplication>>
  try {
    application = await getAdminApplication(id)
  } catch (error) {
    if (error instanceof AdminAccessError) redirect('/admin/sign-in')
    throw error
  }
  if (!application) notFound()
  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/admin/applications"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Applications
        </Link>
        <h1 className="mt-8 text-3xl font-semibold">
          {application.applicantName}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {application.specialty} · {application.status.replace('_', ' ')}
        </p>
        <div className="mt-8 space-y-4 rounded-xl border border-border bg-card p-5 text-sm sm:p-8">
          <p>
            <strong>Email:</strong>{' '}
            <a href={`mailto:${application.email}`} className="underline">
              {application.email}
            </a>
          </p>
          {application.phone && (
            <p>
              <strong>Phone:</strong> {application.phone}
            </p>
          )}
          {application.businessName && (
            <p>
              <strong>Business:</strong> {application.businessName}
            </p>
          )}
          {(application.city || application.state) && (
            <p>
              <strong>Location:</strong>{' '}
              {[application.city, application.state].filter(Boolean).join(', ')}
            </p>
          )}
          {application.portfolioUrl && (
            <p>
              <strong>Portfolio:</strong> {application.portfolioUrl}
            </p>
          )}
          <div>
            <h2 className="font-semibold">Message</h2>
            <p className="mt-2 whitespace-pre-wrap leading-6 text-muted-foreground">
              {application.message}
            </p>
          </div>
        </div>
        <ReviewForm
          action={reviewProfessionalApplication.bind(null, id)}
          status={application.status}
          notes={application.reviewNotes}
        />
      </div>
    </main>
  )
}
