'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { saveOwnProfessionalProfileAction } from './actions'
import type {
  ProfessionalProfileEditActionState,
  ProfessionalProfileFormValues,
} from '@/lib/professional-profile-edit-action'

export function ProfessionalProfileEditForm({
  initialValues,
}: {
  initialValues: ProfessionalProfileFormValues
}) {
  const router = useRouter()
  const [state, action, pending] = useActionState(
    saveOwnProfessionalProfileAction,
    {
      status: 'idle',
      values: initialValues,
      selectedFields: [],
      attempt: 0,
    } satisfies ProfessionalProfileEditActionState,
  )

  useEffect(() => {
    if (state.status === 'saved') router.refresh()
  }, [router, state.status, state.attempt])

  return (
    <section
      aria-labelledby="profile-edit-heading"
      className="border-t border-border pt-8"
    >
      <h3 id="profile-edit-heading" className="text-xl font-semibold text-navy">
        Edit your profile details
      </h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        You can update your biography, website and location. An administrator
        manages your name, specialty, contact details, publication and
        verification.
      </p>
      <form
        key={state.attempt}
        action={action}
        autoComplete="off"
        className="mt-6 space-y-5"
        aria-busy={pending}
      >
        <div className="space-y-2">
          <Label htmlFor="professional-bio">Biography</Label>
          <Textarea
            id="professional-bio"
            name="bio"
            defaultValue={state.values.bio}
            minLength={20}
            maxLength={10000}
            required
            disabled={pending}
            rows={8}
          />
          <p className="text-xs text-muted-foreground">20–10,000 characters.</p>
        </div>
        <OptionalProfileField
          field="websiteUrl"
          label="Portfolio website URL"
          value={state.values.websiteUrl}
          selected={state.selectedFields.includes('websiteUrl')}
          pending={pending}
        />
        <div className="grid gap-5 sm:grid-cols-3">
          {(['city', 'state', 'country'] as const).map((field) => (
            <OptionalProfileField
              key={field}
              field={field}
              label={field.charAt(0).toUpperCase() + field.slice(1)}
              value={state.values[field]}
              selected={state.selectedFields.includes(field)}
              pending={pending}
            />
          ))}
        </div>
        {state.status === 'saved' && (
          <p role="status" className="text-sm text-green-700">
            Profile details saved.
          </p>
        )}
        {state.status === 'invalid' && (
          <p role="alert" className="text-sm text-destructive">
            Check the biography, HTTPS website address and location lengths. No
            changes were saved.
          </p>
        )}
        {state.status === 'denied' && (
          <p role="alert" className="text-sm text-destructive">
            Your account cannot edit this profile. Sign in again or contact
            Archimart if this seems incorrect.
          </p>
        )}
        {state.status === 'unavailable' && (
          <p role="alert" className="text-sm text-destructive">
            Profile editing is unavailable right now.
          </p>
        )}
        {state.status === 'error' && (
          <p role="alert" className="text-sm text-destructive">
            We could not save your changes. Please try again later.
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Select Change for any website or location field you want to update.
          Select it and leave the input blank to clear that field.
        </p>
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save profile details'}
        </Button>
      </form>
    </section>
  )
}

function OptionalProfileField({
  field,
  label,
  value,
  selected,
  pending,
}: {
  field: 'websiteUrl' | 'city' | 'state' | 'country'
  label: string
  value: string
  selected: boolean
  pending: boolean
}) {
  const [editing, setEditing] = useState(selected)
  const id = `professional-${field}`
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={field}
        type={field === 'websiteUrl' ? 'url' : 'text'}
        pattern={field === 'websiteUrl' ? 'https://.*' : undefined}
        defaultValue={value}
        maxLength={field === 'websiteUrl' ? 2048 : 120}
        placeholder={field === 'websiteUrl' ? 'https://example.com' : undefined}
        autoComplete="off"
        disabled={pending || !editing}
      />
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={editing}
          onChange={(event) => setEditing(event.target.checked)}
          disabled={pending}
        />
        Change {label.toLowerCase()}
      </label>
    </div>
  )
}
