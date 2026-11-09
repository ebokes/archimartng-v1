import type { Metadata } from 'next'
import Link from 'next/link'
import { SignInForm } from './sign-in-form'

export const metadata: Metadata = {
  title: 'Admin sign in | Archimart',
  robots: { index: false, follow: false },
}

export default function AdminSignInPage() {
  return (
    <main className="grid min-h-screen bg-background text-foreground lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.85fr)]">
      <section className="relative isolate hidden overflow-hidden bg-navy px-12 py-12 text-navy-foreground lg:flex lg:flex-col lg:justify-between xl:px-20">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 opacity-25 [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
        />
        <Link href="/" className="w-fit text-lg font-extrabold tracking-tight">
          ARCHIMART<span className="text-gold">ng</span>
        </Link>
        <div className="max-w-xl">
          <span className="mb-8 block h-px w-20 bg-gold" />
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-gold">
            Administration
          </p>
          <h1 className="text-5xl font-semibold leading-[1.12] tracking-tight xl:text-6xl">
            A clear view of what gets built.
          </h1>
          <p className="mt-7 max-w-md text-base leading-7 text-navy-foreground/70">
            Sign in to manage Archimart listings and enquiries.
          </p>
        </div>
        <p className="text-xs tracking-wide text-navy-foreground/55">
          Private workspace · Authorized administrators only
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-14 inline-block text-lg font-extrabold tracking-tight text-navy lg:hidden"
          >
            ARCHIMART<span className="text-gold">ng</span>
          </Link>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Admin access
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-navy">
            Welcome back
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Use your approved administrator credentials.
          </p>
          <SignInForm />
          <Link
            href="/"
            className="mt-10 inline-block text-sm font-medium text-muted-foreground underline-offset-4 hover:text-navy hover:underline"
          >
            Back to Archimart
          </Link>
        </div>
      </section>
    </main>
  )
}
