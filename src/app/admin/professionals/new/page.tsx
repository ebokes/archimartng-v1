import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AdminAccessError } from '@/lib/admin-authorization'
import { requireAdmin } from '@/lib/require-admin'
import { createProfessional } from '../actions'
import { ProfessionalForm } from '../professional-form'

export const metadata: Metadata = {
  title: 'Add professional | Archimart',
  robots: { index: false, follow: false },
}

export default async function NewProfessionalPage() {
  try {
    await requireAdmin()
  } catch (error) {
    if (error instanceof AdminAccessError) redirect('/admin/sign-in')
    throw error
  }
  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/admin/professionals"
          className="text-sm text-muted-foreground"
        >
          ← Professionals
        </Link>
        <h1 className="mt-8 text-3xl font-semibold">Add a professional</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Save a draft until the profile is ready. Verification requires manual
          review.
        </p>
        <ProfessionalForm
          action={createProfessional}
          submitLabel="Save professional"
        />
      </div>
    </main>
  )
}
