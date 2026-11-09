'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import type { ProfessionalActionState } from './actions'

type Values = {
  displayName?: string
  slug?: string
  headline?: string | null
  bio?: string
  specialty?: string
  city?: string | null
  state?: string | null
  country?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  websiteUrl?: string | null
  publicationStatus?: 'draft' | 'published' | 'archived'
  verificationStatus?: 'unverified' | 'verified' | 'rejected'
}

const field =
  'mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold focus:ring-2 focus:ring-gold/20'
const label = 'block text-sm font-medium text-foreground'

export function ProfessionalForm({
  action,
  values = {},
  submitLabel,
}: {
  action: (
    state: ProfessionalActionState,
    formData: FormData,
  ) => Promise<ProfessionalActionState>
  values?: Values
  submitLabel: string
}) {
  const [state, formAction, pending] = useActionState(action, { error: null })
  return (
    <form
      action={formAction}
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
      <div className="grid gap-6 sm:grid-cols-2">
        <label className={label}>
          Display name
          <input
            className={field}
            name="displayName"
            required
            minLength={2}
            maxLength={160}
            defaultValue={values.displayName}
          />
        </label>
        <label className={label}>
          Slug
          <input
            className={field}
            name="slug"
            required
            maxLength={180}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            defaultValue={values.slug}
          />
        </label>
        <label className={label}>
          Specialty
          <input
            className={field}
            name="specialty"
            required
            maxLength={120}
            placeholder="e.g. Residential architecture"
            defaultValue={values.specialty}
          />
        </label>
        <label className={label}>
          Headline
          <input
            className={field}
            name="headline"
            maxLength={240}
            defaultValue={values.headline ?? ''}
          />
        </label>
        <label className={`${label} sm:col-span-2`}>
          Biography
          <textarea
            className={field}
            name="bio"
            required
            minLength={20}
            maxLength={10000}
            rows={8}
            defaultValue={values.bio}
          />
        </label>
        <label className={label}>
          City
          <input
            className={field}
            name="city"
            maxLength={120}
            defaultValue={values.city ?? ''}
          />
        </label>
        <label className={label}>
          State
          <input
            className={field}
            name="state"
            maxLength={120}
            defaultValue={values.state ?? ''}
          />
        </label>
        <label className={label}>
          Country
          <input
            className={field}
            name="country"
            maxLength={120}
            defaultValue={values.country ?? 'Nigeria'}
          />
        </label>
        <label className={label}>
          Contact email (admin only)
          <input
            className={field}
            name="contactEmail"
            type="email"
            maxLength={320}
            defaultValue={values.contactEmail ?? ''}
          />
        </label>
        <label className={label}>
          Contact phone (admin only)
          <input
            className={field}
            name="contactPhone"
            type="tel"
            maxLength={40}
            defaultValue={values.contactPhone ?? ''}
          />
        </label>
        <label className={label}>
          Website URL (admin only)
          <input
            className={field}
            name="websiteUrl"
            type="url"
            placeholder="https://example.com"
            defaultValue={values.websiteUrl ?? ''}
          />
        </label>
      </div>
      <div className="grid gap-6 border-t border-border pt-7 sm:grid-cols-2">
        <label className={label}>
          Publication status
          <select
            className={field}
            name="publicationStatus"
            defaultValue={values.publicationStatus ?? 'draft'}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <span className="mt-2 block text-xs font-normal text-muted-foreground">
            Only published profiles appear in the public directory.
          </span>
        </label>
        <label className={label}>
          Verification status
          <select
            className={field}
            name="verificationStatus"
            defaultValue={values.verificationStatus ?? 'unverified'}
          >
            <option value="unverified">Unverified</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
          <span className="mt-2 block text-xs font-normal text-muted-foreground">
            Choose Verified only after manual review.
          </span>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-4 border-t border-border pt-6">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-navy px-5 py-3 text-sm font-semibold text-navy-foreground disabled:opacity-60"
        >
          {pending ? 'Saving…' : submitLabel}
        </button>
        <Link
          href="/admin/professionals"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
