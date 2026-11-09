import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { AdminAccessError } from '@/lib/admin-authorization'
import { isPlanImageUploadConfigured } from '@/lib/plan-image-storage'
import { getAdminPlan } from '@/lib/plans'
import { updatePlan } from '../../actions'
import { PlanForm } from '../../plan-form'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Edit plan | Archimart',
  robots: { index: false, follow: false },
}

export default async function EditPlanPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  let plan: Awaited<ReturnType<typeof getAdminPlan>>
  try {
    plan = await getAdminPlan(id)
  } catch (error) {
    if (error instanceof AdminAccessError) redirect('/admin/sign-in')
    throw error
  }
  if (!plan) notFound()
  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin/plans" className="text-sm text-muted-foreground">
          ← Plans
        </Link>
        <h1 className="mt-8 text-3xl font-semibold">Edit plan</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review the public listing before publishing.
        </p>
        <PlanForm
          action={updatePlan.bind(null, id)}
          submitLabel="Save changes"
          uploadAvailable={isPlanImageUploadConfigured()}
          values={{
            ...plan,
            coverUrl: plan.cover?.imageUrl,
            coverAlt: plan.cover?.altText,
          }}
        />
      </div>
    </main>
  )
}
