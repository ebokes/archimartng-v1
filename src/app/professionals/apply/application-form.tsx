'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import type { ApplicationActionState } from './actions'
import { submitProfessionalApplication } from './actions'

const field =
  'mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold focus:ring-2 focus:ring-gold/20'
const label = 'block text-sm font-medium text-foreground'

export function ApplicationForm() {
  const [state, action, pending] = useActionState<
    ApplicationActionState,
    FormData
  >(submitProfessionalApplication, { error: null, submitted: false })
  if (state.submitted)
    return (
      <div
        role="status"
        className="mt-8 rounded-xl border border-border bg-card p-8"
      >
        <h2 className="text-xl font-semibold">Application received</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          The Archimart team will review your details manually. No account has
          been created.
        </p>
      </div>
    )
  return (
    <form
      key={state.revision ?? 0}
      action={action}
      className="mt-8 space-y-7 rounded-xl border border-border bg-card p-5 sm:p-8"
    >
      {state.error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label>
          Company website
          <input name="companyWebsite" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <label className={label}>
          Your name
          <input
            className={field}
            name="applicantName"
            required
            minLength={2}
            maxLength={160}
            defaultValue={state.values?.applicantName}
          />
        </label>
        <label className={label}>
          Email
          <input
            className={field}
            name="email"
            type="email"
            required
            maxLength={320}
            defaultValue={state.values?.email}
          />
        </label>
        <label className={label}>
          Phone (optional)
          <input
            className={field}
            name="phone"
            type="tel"
            maxLength={40}
            defaultValue={state.values?.phone}
          />
        </label>
        <label className={label}>
          Business name (optional)
          <input
            className={field}
            name="businessName"
            maxLength={160}
            defaultValue={state.values?.businessName}
          />
        </label>
        <label className={label}>
          Specialty
          <input
            className={field}
            name="specialty"
            required
            minLength={2}
            maxLength={120}
            defaultValue={state.values?.specialty}
            placeholder="e.g. Architecture or building"
          />
        </label>
        <label className={label}>
          Portfolio URL (optional)
          <input
            className={field}
            name="portfolioUrl"
            type="url"
            maxLength={2048}
            defaultValue={state.values?.portfolioUrl}
            placeholder="https://example.com"
          />
        </label>
        <label className={label}>
          City (optional)
          <input
            className={field}
            name="city"
            maxLength={120}
            defaultValue={state.values?.city}
          />
        </label>
        <label className={label}>
          State (optional)
          <input
            className={field}
            name="state"
            maxLength={120}
            defaultValue={state.values?.state}
          />
        </label>
        <label className={`${label} sm:col-span-2`}>
          Proposed public biography
          <textarea
            className={field}
            name="proposedBio"
            rows={8}
            required
            minLength={20}
            maxLength={10000}
            defaultValue={state.values?.proposedBio}
            placeholder="Describe your professional background, experience, and the work clients can expect to see on your public profile."
          />
          <span className="mt-2 block text-xs font-normal text-muted-foreground">
            An administrator will review and may edit this text before your
            profile is published.
          </span>
        </label>
        <label className={`${label} sm:col-span-2`}>
          Message to the Archimart team (private)
          <textarea
            className={field}
            name="message"
            rows={6}
            required
            minLength={20}
            maxLength={4000}
            defaultValue={state.values?.message}
            placeholder="Tell us why you are applying or share anything our review team should know."
          />
        </label>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">
        We use these details to review your application and contact you about
        it. Submitting does not publish a profile. Read our{' '}
        <Link href="/privacy" className="underline hover:text-foreground">
          privacy notice
        </Link>{' '}
        for details.
      </p>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-navy px-5 py-3 text-sm font-semibold text-navy-foreground disabled:opacity-60"
      >
        {pending ? 'Submitting…' : 'Submit application'}
      </button>
    </form>
  )
}
