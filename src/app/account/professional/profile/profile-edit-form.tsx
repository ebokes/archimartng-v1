'use client'

import { useActionState, useEffect } from 'react'
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
        <div className="space-y-2">
          <Label htmlFor="professional-website">Portfolio website URL</Label>
          <Input
            id="professional-website"
            name="websiteUrl"
            type="url"
            pattern="https://.*"
            defaultValue={state.values.websiteUrl}
            maxLength={2048}
            placeholder="https://example.com"
            disabled={pending}
          />
          <p className="text-xs text-muted-foreground">
            Use an HTTPS address, or leave blank.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          {(['city', 'state', 'country'] as const).map((field) => (
            <div className="space-y-2" key={field}>
              <Label htmlFor={`professional-${field}`} className="capitalize">
                {field}
              </Label>
              <Input
                id={`professional-${field}`}
                name={field}
                defaultValue={state.values[field]}
                maxLength={120}
                disabled={pending}
              />
            </div>
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
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save profile details'}
        </Button>
      </form>
    </section>
  )
}
