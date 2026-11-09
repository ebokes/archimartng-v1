import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { AdminAccessError } from '@/lib/admin-authorization'
import { getAdminProfessional } from '@/lib/professionals'
import { updateProfessional } from '../../actions'
import { ProfessionalForm } from '../../professional-form'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Edit professional | Archimart',
  robots: { index: false, follow: false },
}

export default async function EditProfessionalPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  let profile: Awaited<ReturnType<typeof getAdminProfessional>>
  try {
    profile = await getAdminProfessional(id)
  } catch (error) {
    if (error instanceof AdminAccessError) redirect('/admin/sign-in')
    throw error
  }
  if (!profile) notFound()
  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/admin/professionals"
          className="text-sm text-muted-foreground"
        >
          ← Professionals
        </Link>
        <h1 className="mt-8 text-3xl font-semibold">Edit professional</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review publication and verification independently.
        </p>
        <ProfessionalForm
          action={updateProfessional.bind(null, id)}
          submitLabel="Save changes"
          values={profile}
        />
      </div>
    </main>
  )
}
