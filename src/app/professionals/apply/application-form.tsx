'use client'

import { useActionState } from 'react'
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
          />
        </label>
        <label className={label}>
          Phone (optional)
          <input className={field} name="phone" type="tel" maxLength={40} />
        </label>
        <label className={label}>
          Business name (optional)
          <input className={field} name="businessName" maxLength={160} />
        </label>
        <label className={label}>
          Specialty
          <input
            className={field}
            name="specialty"
            required
            minLength={2}
            maxLength={120}
            placeholder="e.g. Architecture or building"
          />
        </label>
        <label className={label}>
          Portfolio URL (optional)
          <input
            className={field}
            name="portfolioUrl"
            type="url"
            placeholder="https://example.com"
          />
        </label>
        <label className={label}>
          City (optional)
          <input className={field} name="city" maxLength={120} />
        </label>
        <label className={label}>
          State (optional)
          <input className={field} name="state" maxLength={120} />
        </label>
        <label className={`${label} sm:col-span-2`}>
          Tell us about your work
          <textarea
            className={field}
            name="message"
            rows={6}
            required
            minLength={20}
            maxLength={4000}
            placeholder="Describe your experience and the work you would like to list."
          />
        </label>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">
        We use these details to review your application and contact you about
        it. Submitting does not publish a profile.
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
