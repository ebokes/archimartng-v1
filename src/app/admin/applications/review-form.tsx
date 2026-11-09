'use client'

import { useActionState } from 'react'
import type { ReviewActionState } from './actions'

const field =
  'mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold focus:ring-2 focus:ring-gold/20'

export function ReviewForm({
  action,
  status,
  notes,
}: {
  action: (
    state: ReviewActionState,
    formData: FormData,
  ) => Promise<ReviewActionState>
  status: 'submitted' | 'under_review' | 'approved' | 'rejected'
  notes: string | null
}) {
  const [state, formAction, pending] = useActionState(action, {
    error: null,
    saved: false,
  })
  return (
    <form
      action={formAction}
      className="mt-8 space-y-6 rounded-xl border border-border bg-card p-5 sm:p-8"
    >
      <h2 className="text-xl font-semibold">Manual review</h2>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.saved && (
        <p role="status" className="text-sm text-foreground">
          Review saved.
        </p>
      )}
      <label className="block text-sm font-medium">
        Status
        <select className={field} name="status" defaultValue={status}>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </label>
      <label className="block text-sm font-medium">
        Internal notes
        <textarea
          className={field}
          name="reviewNotes"
          rows={6}
          maxLength={4000}
          defaultValue={notes ?? ''}
        />
      </label>
      <p className="text-xs leading-5 text-muted-foreground">
        Approval does not publish a profile. Once approved, use the application
        page to create a linked private draft. Notes stay in the admin
        workspace.
      </p>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-navy px-5 py-3 text-sm font-semibold text-navy-foreground disabled:opacity-60"
      >
        {pending ? 'Saving…' : 'Save review'}
      </button>
    </form>
  )
}
