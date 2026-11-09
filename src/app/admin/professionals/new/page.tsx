import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { AdminAccessError } from '@/lib/admin-authorization'
import { getAdminApplication } from '@/lib/professional-applications'
import { prefillProfessionalFromApplication } from '@/lib/professional-application-prefill'
import { requireAdmin } from '@/lib/require-admin'
import {
  createProfessional,
  createProfessionalFromApplication,
} from '../actions'
import { ProfessionalForm } from '../professional-form'

export const metadata: Metadata = {
  title: 'Add professional | Archimart',
  robots: { index: false, follow: false },
}

export default async function NewProfessionalPage({
  searchParams,
}: {
  searchParams: Promise<{ applicationId?: string }>
}) {
  const { applicationId } = await searchParams
  let application: Awaited<ReturnType<typeof getAdminApplication>> | null = null
  try {
    await requireAdmin()
    if (applicationId) {
      if (!/^[0-9a-f-]{36}$/i.test(applicationId)) notFound()
      application = await getAdminApplication(applicationId)
    }
  } catch (error) {
    if (error instanceof AdminAccessError) redirect('/admin/sign-in')
    throw error
  }
  if (applicationId && !application) notFound()
  if (
    application &&
    (application.status !== 'approved' || application.professionalId)
  )
    redirect(`/admin/applications/${application.id}`)
  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/admin/professionals"
          className="text-sm text-muted-foreground"
        >
          ← Professionals
        </Link>
        <h1 className="mt-8 text-3xl font-semibold">
          {application
            ? 'Create profile from application'
            : 'Add a professional'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {application
            ? 'Applicant details are prefilled. Write a public biography, then save a private draft. Publication and verification require separate admin actions.'
            : 'Save a draft until the profile is ready. Verification requires manual review.'}
        </p>
        <ProfessionalForm
          action={
            application
              ? createProfessionalFromApplication.bind(null, application.id)
              : createProfessional
          }
          values={
            application
              ? prefillProfessionalFromApplication(application)
              : undefined
          }
          fromApplication={!!application}
          submitLabel={
            application ? 'Create draft profile' : 'Save professional'
          }
        />
      </div>
    </main>
  )
}
