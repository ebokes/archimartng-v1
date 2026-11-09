'use client'

import { useActionState } from 'react'
import type { EnquiryReviewState } from './actions'

type Action = (
  state: EnquiryReviewState,
  data: FormData,
) => Promise<EnquiryReviewState>

const initial: EnquiryReviewState = { error: null, saved: false }
const field =
  'mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-gold focus:ring-2 focus:ring-gold/20'

export function EnquiryReviewForms({
  status,
  statusAction,
  noteAction,
}: {
  status: 'new' | 'in_progress' | 'closed' | 'spam'
  statusAction: Action
  noteAction: Action
}) {
  const [statusState, submitStatus, statusPending] = useActionState(
    statusAction,
    initial,
  )
  const [noteState, submitNote, notePending] = useActionState(
    noteAction,
    initial,
  )
  return (
    <div className="mt-8 grid gap-6 sm:grid-cols-2">
      <form
        action={submitStatus}
        className="space-y-5 rounded-xl border border-border bg-card p-5"
      >
        <h2 className="text-xl font-semibold">Status</h2>
        {statusState.error && (
          <p role="alert" className="text-sm text-destructive">
            {statusState.error}
          </p>
        )}
        {statusState.saved && (
          <p role="status" className="text-sm">
            Status saved.
          </p>
        )}
        <label className="block text-sm font-medium">
          Enquiry status
          <select className={field} name="status" defaultValue={status}>
            <option value="new">New</option>
            <option value="in_progress">In progress</option>
            <option value="closed">Closed</option>
            <option value="spam">Spam</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={statusPending}
          className="rounded-lg bg-navy px-5 py-3 text-sm font-semibold text-navy-foreground disabled:opacity-60"
        >
          {statusPending ? 'Saving…' : 'Save status'}
        </button>
      </form>
      <form
        action={submitNote}
        className="space-y-5 rounded-xl border border-border bg-card p-5"
      >
        <h2 className="text-xl font-semibold">Add follow-up note</h2>
        {noteState.error && (
          <p role="alert" className="text-sm text-destructive">
            {noteState.error}
          </p>
        )}
        {noteState.saved && (
          <p role="status" className="text-sm">
            Note saved. Refresh to see it below.
          </p>
        )}
        <label className="block text-sm font-medium">
          Internal note
          <textarea
            className={field}
            name="body"
            required
            maxLength={4000}
            rows={5}
          />
        </label>
        <button
          type="submit"
          disabled={notePending}
          className="rounded-lg bg-navy px-5 py-3 text-sm font-semibold text-navy-foreground disabled:opacity-60"
        >
          {notePending ? 'Saving…' : 'Add note'}
        </button>
      </form>
    </div>
  )
}
