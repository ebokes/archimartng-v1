import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { AdminAccessError } from '@/lib/admin-authorization'
import { getAdminEnquiry } from '@/lib/enquiries'
import { addEnquiryNote, updateEnquiryStatus } from '../actions'
import { EnquiryReviewForms } from '../review-forms'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Review enquiry | Archimart',
  robots: { index: false, follow: false },
}

const dateFormatter = new Intl.DateTimeFormat('en-NG', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Africa/Lagos',
})

export default async function AdminEnquiryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  let enquiry: Awaited<ReturnType<typeof getAdminEnquiry>>
  try {
    enquiry = await getAdminEnquiry(id)
  } catch (error) {
    if (error instanceof AdminAccessError) redirect('/admin/sign-in')
    throw error
  }
  if (!enquiry) notFound()
  const listingHref = enquiry.planSlug
    ? `/plans/${enquiry.planSlug}`
    : enquiry.professionalSlug
      ? `/professionals/${enquiry.professionalSlug}`
      : null
  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/admin/enquiries"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Enquiries
        </Link>
        <h1 className="mt-8 text-3xl font-semibold">{enquiry.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Received {dateFormatter.format(enquiry.createdAt)} ·{' '}
          {enquiry.status.replace('_', ' ')}
        </p>
        <div className="mt-8 space-y-4 rounded-xl border border-border bg-card p-5 text-sm sm:p-8">
          <p>
            <strong>Listing:</strong>{' '}
            {listingHref ? (
              <Link href={listingHref} className="underline">
                {enquiry.planTitle ?? enquiry.professionalName}
              </Link>
            ) : (
              (enquiry.planTitle ??
              enquiry.professionalName ??
              'Unavailable listing')
            )}
          </p>
          <p>
            <strong>Email:</strong>{' '}
            <a href={`mailto:${enquiry.email}`} className="underline">
              {enquiry.email}
            </a>
          </p>
          {enquiry.phone && (
            <p>
              <strong>Phone:</strong> {enquiry.phone}
            </p>
          )}
          <div>
            <h2 className="font-semibold">Message</h2>
            <p className="mt-2 whitespace-pre-wrap leading-6 text-muted-foreground">
              {enquiry.message}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Consent: {enquiry.consentVersion} ·{' '}
            {dateFormatter.format(enquiry.consentedAt)}
          </p>
        </div>
        <EnquiryReviewForms
          status={enquiry.status}
          statusAction={updateEnquiryStatus.bind(null, id)}
          noteAction={addEnquiryNote.bind(null, id)}
        />
        <section className="mt-8">
          <h2 className="text-xl font-semibold">Internal follow-up notes</h2>
          {enquiry.notes.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No notes yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {enquiry.notes.map((note) => (
                <article
                  key={note.id}
                  className="rounded-xl border border-border bg-card p-5"
                >
                  <time
                    dateTime={note.createdAt.toISOString()}
                    className="text-xs text-muted-foreground"
                  >
                    {dateFormatter.format(note.createdAt)}
                  </time>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                    {note.body}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
