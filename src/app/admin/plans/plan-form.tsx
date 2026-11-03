'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import type { PlanActionState } from './actions'

type Values = {
  title?: string
  slug?: string
  summary?: string | null
  description?: string
  propertyType?: string
  bedrooms?: number | null
  bathrooms?: number | null
  floors?: number | null
  plotAreaSqm?: string | null
  floorAreaSqm?: string | null
  publicationStatus?: 'draft' | 'published' | 'archived'
  coverUrl?: string
  coverAlt?: string
}

const field =
  'mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold focus:ring-2 focus:ring-gold/20'
const label = 'block text-sm font-medium text-foreground'

export function PlanForm({
  action,
  values = {},
  submitLabel,
}: {
  action: (
    state: PlanActionState,
    formData: FormData,
  ) => Promise<PlanActionState>
  values?: Values
  submitLabel: string
}) {
  const [state, formAction, pending] = useActionState(action, { error: null })
  return (
    <form
      action={formAction}
      className="mt-8 space-y-8 rounded-xl border border-border bg-card p-5 sm:p-8"
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
          Title
          <input
            className={field}
            name="title"
            required
            maxLength={160}
            defaultValue={values.title}
          />
        </label>
        <label className={label}>
          Slug
          <input
            className={field}
            name="slug"
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            maxLength={180}
            defaultValue={values.slug}
          />
        </label>
        <label className={`${label} sm:col-span-2`}>
          Short summary
          <textarea
            className={field}
            name="summary"
            rows={2}
            maxLength={500}
            defaultValue={values.summary ?? ''}
          />
        </label>
        <label className={`${label} sm:col-span-2`}>
          Description
          <textarea
            className={field}
            name="description"
            rows={8}
            required
            minLength={20}
            maxLength={10000}
            defaultValue={values.description}
          />
        </label>
        <label className={label}>
          Property type
          <input
            className={field}
            name="propertyType"
            required
            maxLength={80}
            placeholder="e.g. Bungalow"
            defaultValue={values.propertyType}
          />
        </label>
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
        </label>
        <label className={label}>
          Bedrooms
          <input
            className={field}
            name="bedrooms"
            type="number"
            min="0"
            max="100"
            step="1"
            defaultValue={values.bedrooms ?? ''}
          />
        </label>
        <label className={label}>
          Bathrooms
          <input
            className={field}
            name="bathrooms"
            type="number"
            min="0"
            max="100"
            step="1"
            defaultValue={values.bathrooms ?? ''}
          />
        </label>
        <label className={label}>
          Floors
          <input
            className={field}
            name="floors"
            type="number"
            min="1"
            max="100"
            step="1"
            defaultValue={values.floors ?? ''}
          />
        </label>
        <label className={label}>
          Plot area (m²)
          <input
            className={field}
            name="plotAreaSqm"
            type="number"
            min="0.01"
            step="0.01"
            defaultValue={values.plotAreaSqm ?? ''}
          />
        </label>
        <label className={label}>
          Floor area (m²)
          <input
            className={field}
            name="floorAreaSqm"
            type="number"
            min="0.01"
            step="0.01"
            defaultValue={values.floorAreaSqm ?? ''}
          />
        </label>
      </div>
      <div className="border-t border-border pt-7">
        <h2 className="text-lg font-semibold">Cover image</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Use an HTTPS image URL. A cover is required before publication. To
          change an existing cover, enter a replacement URL.
        </p>
        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          <label className={label}>
            Image URL
            <input
              className={field}
              name="coverUrl"
              type="url"
              placeholder="https://example.com/plan.jpg"
              defaultValue={values.coverUrl ?? ''}
            />
          </label>
          <label className={label}>
            Image description
            <input
              className={field}
              name="coverAlt"
              maxLength={200}
              defaultValue={values.coverAlt ?? ''}
            />
          </label>
        </div>
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
          href="/admin/plans"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
