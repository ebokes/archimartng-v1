import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy notice | Archimart',
  description:
    'How Archimart handles professional applications and client enquiries.',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground sm:px-8">
      <article className="mx-auto max-w-3xl space-y-8 text-sm leading-7 text-muted-foreground">
        <Link href="/" className="hover:underline">
          ← Archimart home
        </Link>
        <header>
          <h1 className="text-3xl font-semibold text-foreground">
            Privacy notice
          </h1>
          <p className="mt-3">Updated 10 November 2026</p>
          <p className="mt-4">
            Archimart is an admin-managed architecture marketplace. This notice
            explains how the site handles information sent through its
            professional application and client enquiry forms.
          </p>
        </header>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            Information you provide
          </h2>
          <p className="mt-2">
            A professional application includes your name, email, specialty,
            proposed public biography, and a private message to our team. You
            may also provide a phone number, business name, city, state, and
            portfolio URL. We record the application date, review status,
            internal review notes, and any profile linked to the application.
          </p>
          <p className="mt-3">
            An enquiry includes your name, email, message, and the plan or
            professional you asked about. You may also provide a phone number.
            We record when you accepted the enquiry consent statement, its
            version, the enquiry status, and internal follow-up notes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            How we use and share it
          </h2>
          <p className="mt-2">
            Archimart administrators review applications, decide whether to
            create a professional profile, and follow up on enquiries manually.
            An application does not create an account or publish a profile.
            Administrators may edit an applicant&apos;s proposed biography
            before publishing a profile. Published profiles may show the
            approved name, biography, specialty, and location; the contact email
            and phone stored for administration are not displayed on the public
            profile.
          </p>
          <p className="mt-3">
            Enquiries are not public. If needed to respond to an enquiry,
            Archimart may manually share the contact details and message with
            the professional in the listing, as described beside the enquiry
            form. The application does not send automated notifications or
            marketing messages.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            Storage and access
          </h2>
          <p className="mt-2">
            The site runs on Vercel and stores submitted application and enquiry
            records in Neon PostgreSQL. Within the Archimart application, only
            signed-in administrators with an active administrator record can
            view submissions and internal notes. Public pages show only profiles
            and plans that administrators have published.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">
            Retention and requests
          </h2>
          <p className="mt-2">
            Archimart keeps submissions and related notes while they are needed
            for application review or enquiry follow-up. The site does not yet
            delete old records automatically. Archimart is establishing a manual
            review and deletion schedule before public launch; this notice will
            be updated when that schedule is adopted.
          </p>
          <p className="mt-3">
            You may ask Archimart to review, correct, or delete information you
            submitted. Send privacy and data requests to{' '}
            <a
              href="mailto:archimartng@gmail.com"
              className="underline hover:text-foreground"
            >
              archimartng@gmail.com
            </a>
            .
          </p>
        </section>
      </article>
    </main>
  )
}
