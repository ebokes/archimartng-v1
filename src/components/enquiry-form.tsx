'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { submitEnquiry, type EnquiryActionState } from '@/app/enquiries/actions'

const field =
  'mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold focus:ring-2 focus:ring-gold/20'
const label = 'block text-sm font-medium text-foreground'

export function EnquiryForm({
  targetType,
  slug,
}: {
  targetType: 'plan' | 'professional'
  slug: string
}) {
  const [state, action, pending] = useActionState<EnquiryActionState, FormData>(
    submitEnquiry.bind(null, targetType, slug),
    { error: null, submitted: false },
  )
  if (state.submitted)
    return (
      <div
        role="status"
        className="mt-9 rounded-xl border border-border bg-card p-6"
      >
        <h2 className="text-xl font-semibold">Enquiry received</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The Archimart team will review your message and follow up manually.
        </p>
      </div>
    )
  return (
    <form
      key={state.revision ?? 0}
      action={action}
      className="mt-9 space-y-5 rounded-xl border border-border bg-card p-6"
    >
      <h2 className="text-xl font-semibold">Enquire about this {targetType}</h2>
      <p className="text-sm text-muted-foreground">
        Send your question to the Archimart team. We review enquiries manually.
      </p>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label>
          Company website
          <input name="companyWebsite" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={label}>
          Your name
          <input
            className={field}
            name="name"
            required
            minLength={2}
            maxLength={160}
            defaultValue={state.values?.name}
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
      </div>
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
        Your message
        <textarea
          className={field}
          name="message"
          required
          minLength={20}
          maxLength={4000}
          defaultValue={state.values?.message}
          rows={5}
        />
      </label>
      <label className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
        <input
          className="mt-1.5"
          type="checkbox"
          name="consentAccepted"
          value="yes"
          required
          defaultChecked={state.values?.consentAccepted === 'yes'}
        />
        <span>
          I agree that Archimart may use my contact details and message to
          respond to this enquiry and, if needed, share them with the
          professional in this listing.
        </span>
      </label>
      <p className="text-xs text-muted-foreground">
        Read our{' '}
        <Link href="/privacy" className="underline hover:text-foreground">
          privacy notice
        </Link>{' '}
        to see how we handle your enquiry.
      </p>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-navy px-5 py-3 text-sm font-semibold text-navy-foreground disabled:opacity-60"
      >
        {pending ? 'Sending…' : 'Send enquiry'}
      </button>
    </form>
  )
}
