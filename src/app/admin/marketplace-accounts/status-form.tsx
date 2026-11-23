'use client'

import { useActionState } from 'react'
import type { AccountStatusFormState } from './actions'

export function MarketplaceAccountStatusForm({
  action,
  status,
}: {
  action: (
    state: AccountStatusFormState,
    formData: FormData,
  ) => Promise<AccountStatusFormState>
  status: 'active' | 'suspended'
}) {
  const [state, formAction, pending] = useActionState(action, {
    error: null,
    saved: false,
  })
  const change = status === 'active' ? 'suspend' : 'restore'
  return (
    <form
      action={formAction}
      className="mt-8 rounded-xl border border-border bg-card p-6"
    >
      <h2 className="text-xl font-semibold">
        {change === 'suspend' ? 'Suspend account' : 'Restore account'}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {change === 'suspend'
          ? 'Suspension blocks marketplace access and revokes current sessions.'
          : 'Restoration returns the account to active status. Professional approval does not change.'}
      </p>
      {state.error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.saved && (
        <p role="status" className="mt-4 text-sm">
          Status saved. Refresh to see the current status and history.
        </p>
      )}
      <input type="hidden" name="action" value={change} />
      <label htmlFor="status-reason" className="mt-5 block text-sm font-medium">
        Administrative reason
      </label>
      <textarea
        id="status-reason"
        name="reason"
        required
        maxLength={2000}
        rows={4}
        className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
      />
      <p className="mt-2 text-xs text-muted-foreground">
        Only administrators can read this reason.
      </p>
      <button
        type="submit"
        disabled={pending || state.saved}
        className="mt-5 rounded-lg bg-navy px-5 py-3 text-sm font-semibold text-navy-foreground disabled:opacity-60"
      >
        {pending
          ? 'Saving…'
          : state.saved
            ? 'Saved'
            : change === 'suspend'
              ? 'Suspend account'
              : 'Restore account'}
      </button>
    </form>
  )
}
