'use client'

import { useActionState, useEffect, useState } from 'react'
import Link from 'next/link'
import { PlanImage } from '@/components/plan-image'
import { MAX_PLAN_IMAGE_BYTES } from '@/lib/plan-image-upload'
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
  uploadAvailable,
}: {
  action: (
    state: PlanActionState,
    formData: FormData,
  ) => Promise<PlanActionState>
  values?: Values
  submitLabel: string
  uploadAvailable: boolean
}) {
  const [state, formAction, pending] = useActionState(action, { error: null })
  const [coverUrl, setCoverUrl] = useState(values.coverUrl ?? '')
  const [coverSource, setCoverSource] = useState<'url' | 'upload'>('url')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverFileError, setCoverFileError] = useState<string | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [imageCheck, setImageCheck] = useState<{
    url: string
    status: 'loaded' | 'failed'
  } | null>(null)
  const coverReady =
    coverSource === 'upload' ||
    !coverUrl ||
    (imageCheck?.url === coverUrl && imageCheck.status === 'loaded')

  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview)
    }
  }, [filePreview])

  useEffect(() => {
    if (!coverUrl) return
    let active = true
    const image = new window.Image()
    const timer = window.setTimeout(() => {
      image.onload = () => {
        if (active) setImageCheck({ url: coverUrl, status: 'loaded' })
      }
      image.onerror = () => {
        if (active) setImageCheck({ url: coverUrl, status: 'failed' })
      }
      image.src = coverUrl
    }, 300)
    return () => {
      active = false
      window.clearTimeout(timer)
      image.onload = null
      image.onerror = null
    }
  }, [coverUrl])

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
          Paste a direct public HTTPS image URL or upload a JPEG, PNG, WebP, or
          AVIF file (up to 4 MB). A described cover is required before
          publication.
        </p>
        <div className="mt-5 flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="coverSource"
              value="url"
              checked={coverSource === 'url'}
              onChange={() => setCoverSource('url')}
            />
            Paste image URL
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="coverSource"
              value="upload"
              checked={coverSource === 'upload'}
              disabled={!uploadAvailable}
              onChange={() => setCoverSource('upload')}
            />
            Upload image
          </label>
        </div>
        {!uploadAvailable && (
          <p className="mt-3 text-sm text-muted-foreground">
            Image upload is unavailable until Cloudflare R2 storage is
            configured. You can still paste a public image URL.
          </p>
        )}
        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          {coverSource === 'url' ? (
            <label className={label}>
              Image URL
              <input
                className={field}
                name="coverUrl"
                type="text"
                inputMode="url"
                placeholder="https://example.com/plan.jpg"
                value={coverUrl}
                onChange={(event) => setCoverUrl(event.target.value)}
                aria-describedby="cover-image-status"
              />
            </label>
          ) : (
            <label className={label}>
              Image file
              <input
                className={field}
                name="coverFile"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                aria-describedby="cover-image-status"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null
                  setCoverFile(file)
                  setFilePreview(file ? URL.createObjectURL(file) : null)
                  setCoverFileError(
                    file && file.size > MAX_PLAN_IMAGE_BYTES
                      ? 'Choose an image of 4 MB or less.'
                      : null,
                  )
                }}
              />
            </label>
          )}
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
        <div
          id="cover-image-status"
          className="mt-4 text-sm"
          aria-live="polite"
        >
          {coverSource === 'upload' ? (
            coverFileError ? (
              <p className="text-destructive">{coverFileError}</p>
            ) : coverFile ? (
              <p className="text-muted-foreground">
                Selected: {coverFile.name}
              </p>
            ) : (
              <p className="text-muted-foreground">
                Choose an image to upload.
              </p>
            )
          ) : coverUrl &&
            imageCheck?.url === coverUrl &&
            imageCheck.status === 'failed' ? (
            <p className="text-destructive">
              This URL did not load as an image. Use a direct, publicly
              accessible image URL.
            </p>
          ) : coverUrl && !coverReady ? (
            <p className="text-muted-foreground">Checking image…</p>
          ) : coverUrl ? (
            <p className="text-muted-foreground">Image loaded successfully.</p>
          ) : null}
        </div>
        {coverSource === 'url' && coverUrl && coverReady && (
          <div className="relative mt-4 aspect-[4/3] max-w-sm overflow-hidden rounded-lg bg-muted">
            <PlanImage src={coverUrl} alt="Cover preview" sizes="384px" />
          </div>
        )}
        {coverSource === 'upload' && filePreview && !coverFileError && (
          <div className="relative mt-4 aspect-[4/3] max-w-sm overflow-hidden rounded-lg bg-muted">
            {/* A local object URL is only used for this temporary preview. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={filePreview}
              alt="Selected cover preview"
              className="h-full w-full object-cover"
            />
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-4 border-t border-border pt-6">
        <button
          type="submit"
          disabled={
            pending ||
            !coverReady ||
            (coverSource === 'upload' && Boolean(coverFileError))
          }
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
