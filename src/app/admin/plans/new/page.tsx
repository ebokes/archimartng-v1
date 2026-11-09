import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AdminAccessError } from '@/lib/admin-authorization'
import { isPlanImageUploadConfigured } from '@/lib/plan-image-storage'
import { requireAdmin } from '@/lib/require-admin'
import { createPlan } from '../actions'
import { PlanForm } from '../plan-form'

export const metadata: Metadata = {
  title: 'Add plan | Archimart',
  robots: { index: false, follow: false },
}

export default async function NewPlanPage() {
  try {
    await requireAdmin()
  } catch (error) {
    if (error instanceof AdminAccessError) redirect('/admin/sign-in')
    throw error
  }
  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin/plans" className="text-sm text-muted-foreground">
          ← Plans
        </Link>
        <h1 className="mt-8 text-3xl font-semibold">Add a plan</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Save as a draft until the listing is ready for clients.
        </p>
        <PlanForm
          action={createPlan}
          submitLabel="Save plan"
          uploadAvailable={isPlanImageUploadConfigured()}
        />
      </div>
    </main>
  )
}
