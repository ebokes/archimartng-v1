import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { AdminAccessError } from '@/lib/admin-authorization'
import {
  getAdminProfessionalAccount,
  isLocalProfessionalAccountReviewEnabled,
} from '@/lib/admin-professional-accounts'
import {
  getLinkedClaimApplication,
  getUnownedProfessionalProfiles,
} from '@/lib/admin-professional-claims'
import {
  saveProfessionalAccountReview,
  saveProfessionalProfileClaim,
} from '../actions'
import { ProfessionalProfileClaimForm } from '../claim-form'
import { ProfessionalAccountReviewForm } from '../review-form'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Review professional account | Archimart',
  robots: { index: false, follow: false },
}

const dateFormatter = new Intl.DateTimeFormat('en-NG', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Africa/Lagos',
})

export default async function ProfessionalAccountPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  if (!isLocalProfessionalAccountReviewEnabled()) notFound()
  const { id } = await params
  let account: Awaited<ReturnType<typeof getAdminProfessionalAccount>>
  try {
    account = await getAdminProfessionalAccount(id)
  } catch (error) {
    if (error instanceof AdminAccessError) redirect('/admin/sign-in')
    throw error
  }
  if (!account) notFound()

  const canReview =
    account.role === 'professional' &&
    account.accountStatus === 'active' &&
    account.emailVerified &&
    account.profileId === null
  const canClaim = canReview && account.approvalStatus === 'approved'
  let profiles: Awaited<ReturnType<typeof getUnownedProfessionalProfiles>> = []
  let application: Awaited<
    ReturnType<typeof getLinkedClaimApplication>
  > | null = null
  if (canClaim) {
    try {
      ;[profiles, application] = await Promise.all([
        getUnownedProfessionalProfiles(),
        account.applicationId
          ? getLinkedClaimApplication(account.applicationId)
          : Promise.resolve(null),
      ])
    } catch (error) {
      if (error instanceof AdminAccessError) redirect('/admin/sign-in')
      throw error
    }
  }

  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/admin/professional-accounts"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Professional accounts
        </Link>
        <h1 className="mt-8 text-3xl font-semibold">{account.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Account decision: {account.approvalStatus}
        </p>
        <div className="mt-8 space-y-3 rounded-xl border border-border bg-card p-6 text-sm">
          <p>
            <strong>Email:</strong> {account.email}
          </p>
          <p>
            <strong>Email verified:</strong>{' '}
            {account.emailVerified ? 'Yes' : 'No'}
          </p>
          <p>
            <strong>Account status:</strong> {account.accountStatus}
          </p>
          <p>
            <strong>Onboarding started:</strong>{' '}
            {dateFormatter.format(account.createdAt)}
          </p>
          {account.applicationId && (
            <p>
              <strong>Linked V1 application:</strong>{' '}
              <Link
                href={`/admin/applications/${account.applicationId}`}
                className="underline"
              >
                Review separately
              </Link>
            </p>
          )}
          {application && (
            <p>
              <strong>Linked application evidence:</strong>{' '}
              {application.applicantName} · {application.specialty} ·{' '}
              {application.status}
              {application.professionalId
                ? ' · Profile association recorded'
                : ' · No profile association recorded'}
            </p>
          )}
          <p>
            <strong>Profile ownership:</strong>{' '}
            {account.profileId ? 'Linked' : 'None'}
          </p>
        </div>
        <section className="mt-8 rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold">Review history</h2>
          {account.events.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No events recorded.
            </p>
          ) : (
            <ol className="mt-4 space-y-5">
              {account.events.map((event) => (
                <li
                  key={event.id}
                  className="border-t border-border pt-4 text-sm"
                >
                  <p className="font-semibold">
                    {event.eventType.replaceAll('_', ' ')}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {dateFormatter.format(event.createdAt)}
                    {event.actorName ? ` · ${event.actorName}` : ''}
                  </p>
                  {event.reason && (
                    <p className="mt-2 whitespace-pre-wrap">{event.reason}</p>
                  )}
                  {event.profileId && (
                    <Link
                      href={`/admin/professionals/${event.profileId}/edit`}
                      className="mt-2 inline-block underline"
                    >
                      Linked profile
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>
        {canReview && (
          <ProfessionalAccountReviewForm
            action={saveProfessionalAccountReview.bind(null, id)}
            approvalStatus={account.approvalStatus}
          />
        )}
        {canClaim &&
          application?.status !== 'approved' &&
          account.applicationId && (
            <p className="mt-8 rounded-xl border border-border p-5 text-sm text-muted-foreground">
              The linked application must be approved before its profile can be
              claimed.
            </p>
          )}
        {canClaim &&
          (!account.applicationId || application?.status === 'approved') && (
            <ProfessionalProfileClaimForm
              action={saveProfessionalProfileClaim.bind(null, id)}
              profiles={
                application?.professionalId
                  ? profiles.filter(
                      (profile) => profile.id === application.professionalId,
                    )
                  : profiles
              }
            />
          )}
      </div>
    </main>
  )
}
