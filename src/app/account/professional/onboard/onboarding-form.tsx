'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { beginProfessionalOnboardingAction } from './actions'
import type { ProfessionalOnboardingActionState } from '@/lib/professional-onboarding-action'

const initialState: ProfessionalOnboardingActionState = { status: 'idle' }

export function ProfessionalOnboardingForm() {
  const [state, action, pending] = useActionState(
    beginProfessionalOnboardingAction,
    initialState,
  )

  if (state.status === 'pending') {
    return (
      <div role="status" className="rounded-lg border border-border p-5">
        <p className="font-semibold">Pending administrator review</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Your account is now awaiting professional approval. This does not
          publish a profile or grant a verification badge.
        </p>
        <Link
          href="/account/professional/status"
          className="mt-4 inline-block text-sm font-medium underline"
        >
          View your approval status
        </Link>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-5">
      <p className="text-sm leading-6 text-muted-foreground">
        Starting onboarding changes this client account to a professional
        account. Administrator approval is required before professional access.
      </p>
      {state.status === 'unavailable' && (
        <p role="alert" className="text-sm text-destructive">
          Professional onboarding is not available right now.
        </p>
      )}
      {state.status === 'error' && (
        <p role="alert" className="text-sm text-destructive">
          We could not start onboarding. Check your account or try again later.
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Starting onboarding…' : 'Begin professional onboarding'}
      </Button>
    </form>
  )
}
