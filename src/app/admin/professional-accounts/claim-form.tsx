'use client'

import { useActionState } from 'react'
import type { ProfessionalProfileClaimState } from './actions'

type ProfileOption = {
  id: string
  displayName: string
  specialty: string
  city: string | null
  state: string | null
  publicationStatus: string
  verificationStatus: string
}

export function ProfessionalProfileClaimForm({
  action,
  profiles,
}: {
  action: (
    state: ProfessionalProfileClaimState,
    formData: FormData,
  ) => Promise<ProfessionalProfileClaimState>
  profiles: ProfileOption[]
}) {
  const [state, formAction, pending] = useActionState(action, {
    error: null,
    saved: false,
  })
  return (
    <form
      action={formAction}
      className="mt-8 rounded-xl border border-border bg-card p-6"
    >
      <h2 className="text-xl font-semibold">Claim an existing profile</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Confirm independent ownership evidence before linking. Names, email
        addresses, phone numbers and portfolio URLs alone are insufficient. This
        action does not publish or verify the profile or grant editing access.
      </p>
      {profiles.length === 0 ? (
        <p className="mt-5 text-sm text-muted-foreground">
          No unowned profiles are available.
        </p>
      ) : (
        <>
          {state.error && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {state.error}
            </p>
          )}
          {state.saved && (
            <p role="status" className="mt-4 text-sm">
              Profile association saved.
            </p>
          )}
          <label
            htmlFor="claim-profile"
            className="mt-5 block text-sm font-medium"
          >
            Existing unowned profile
          </label>
          <select
            id="claim-profile"
            name="profileId"
            required
            defaultValue=""
            className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
          >
            <option value="" disabled>
              Select a profile
            </option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.displayName} · {profile.specialty} ·{' '}
                {[profile.city, profile.state].filter(Boolean).join(', ') ||
                  'Location unspecified'}{' '}
                · {profile.publicationStatus} · {profile.verificationStatus}
              </option>
            ))}
          </select>
          <label
            htmlFor="claim-evidence"
            className="mt-5 block text-sm font-medium"
          >
            Ownership evidence reviewed
          </label>
          <textarea
            id="claim-evidence"
            name="evidenceSummary"
            required
            minLength={1}
            maxLength={900}
            rows={3}
            className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
            placeholder="Record the evidence and how it was checked; avoid unnecessary sensitive details."
          />
          <label
            htmlFor="claim-reason"
            className="mt-5 block text-sm font-medium"
          >
            Administrative approval reason
          </label>
          <textarea
            id="claim-reason"
            name="reason"
            required
            minLength={1}
            maxLength={900}
            rows={3}
            className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
          />
          <label className="mt-5 flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              name="evidenceReviewed"
              required
              className="mt-1"
            />
            I reviewed independent evidence of control and confirmed this
            account and profile are eligible to link.
          </label>
          <button
            type="submit"
            disabled={pending}
            className="mt-5 rounded-lg bg-navy px-5 py-3 text-sm font-semibold text-navy-foreground disabled:opacity-60"
          >
            {pending ? 'Saving…' : 'Approve profile claim'}
          </button>
        </>
      )}
    </form>
  )
}
