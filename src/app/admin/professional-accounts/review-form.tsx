'use client'

import { useActionState } from 'react'
import type { ProfessionalAccountReviewState } from './actions'

export function ProfessionalAccountReviewForm({
  action,
  approvalStatus,
}: {
  action: (
    state: ProfessionalAccountReviewState,
    formData: FormData,
  ) => Promise<ProfessionalAccountReviewState>
  approvalStatus: 'pending' | 'approved' | 'rejected'
}) {
  const [state, formAction, pending] = useActionState(action, {
    error: null,
    saved: false,
  })
  if (approvalStatus === 'approved') return null

  return (
    <form
      action={formAction}
      className="mt-8 rounded-xl border border-border bg-card p-6"
    >
      <h2 className="text-xl font-semibold">Record a decision</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Review identity and qualification evidence before approval. This
        decision does not link, publish, or verify a professional profile.
      </p>
      {state.error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.saved && (
        <p role="status" className="mt-4 text-sm">
          Decision saved.
        </p>
      )}
      <label
        className="mt-5 block text-sm font-medium"
        htmlFor="account-decision"
      >
        Decision
      </label>
      <select
        id="account-decision"
        name="decision"
        required
        defaultValue=""
        className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
      >
        <option value="" disabled>
          Select a decision
        </option>
        {approvalStatus === 'pending' ? (
          <>
            <option value="approved">Approve account</option>
            <option value="rejected">Reject account</option>
          </>
        ) : (
          <option value="pending">Reopen for review</option>
        )}
      </select>
      <label
        className="mt-5 block text-sm font-medium"
        htmlFor="account-reason"
      >
        Internal reason
      </label>
      <textarea
        id="account-reason"
        name="reason"
        required
        minLength={1}
        maxLength={2000}
        rows={4}
        className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
      />
      <p className="mt-2 text-xs text-muted-foreground">
        Only administrators can read this reason.
      </p>
      <button
        type="submit"
        disabled={pending}
        className="mt-5 rounded-lg bg-navy px-5 py-3 text-sm font-semibold text-navy-foreground disabled:opacity-60"
      >
        {pending ? 'Saving…' : 'Save decision'}
      </button>
    </form>
  )
}
