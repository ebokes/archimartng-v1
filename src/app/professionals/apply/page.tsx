import type { Metadata } from 'next'
import Link from 'next/link'
import { ApplicationForm } from './application-form'

export const metadata: Metadata = {
  title: 'Apply for a professional listing | Archimart',
  description:
    'Apply to have your architecture or building professional profile reviewed by the Archimart team.',
}

export default function ProfessionalApplyPage() {
  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/professionals"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Professional directory
        </Link>
        <p className="mt-9 text-xs font-semibold uppercase tracking-widest text-gold">
          Professional applications
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Apply to be listed</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Tell us about your work. Our team reviews each application manually.
          An application does not create an account or a public listing.
        </p>
        <ApplicationForm />
      </div>
    </main>
  )
}
