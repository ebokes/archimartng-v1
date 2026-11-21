'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { registerClientAction, type RegistrationActionState } from './actions'

const initialState: RegistrationActionState = { status: 'idle' }

export function RegistrationForm() {
  const [state, action, pending] = useActionState(
    registerClientAction,
    initialState,
  )

  if (state.status === 'accepted') {
    return (
      <div
        role="status"
        className="rounded-lg border border-border p-5 text-sm leading-6"
      >
        <p className="font-semibold">Check your email</p>
        <p className="mt-2">
          If we can create your account, you’ll receive a verification email.
          Open its link before signing in.
        </p>
        <Link
          href="/account/sign-in"
          className="mt-4 inline-block font-medium underline"
        >
          Go to client sign in
        </Link>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="client-name">Name</Label>
        <Input
          id="client-name"
          name="name"
          autoComplete="name"
          maxLength={100}
          required
          disabled={pending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="client-email">Email address</Label>
        <Input
          id="client-email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          required
          disabled={pending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="client-password">Password</Label>
        <Input
          id="client-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          required
          disabled={pending}
        />
        <p className="text-xs text-muted-foreground">
          Use at least 12 characters.
        </p>
      </div>
      <div className="sr-only" aria-hidden="true">
        <Label htmlFor="client-website">Leave this field blank</Label>
        <Input
          id="client-website"
          name="companyWebsite"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      {state.status === 'invalid' && (
        <p role="alert" className="text-sm text-destructive">
          Check your name, email address, and password.
        </p>
      )}
      {state.status === 'unavailable' && (
        <p role="alert" className="text-sm text-destructive">
          Registration is not available right now.
        </p>
      )}
      {state.status === 'limited' && (
        <p role="alert" className="text-sm text-destructive">
          Too many requests. Please try again later.
        </p>
      )}
      {state.status === 'error' && (
        <p role="alert" className="text-sm text-destructive">
          We could not process your request. Please try again later.
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Submitting…' : 'Create client account'}
      </Button>
      <p className="text-sm text-muted-foreground">
        Already verified?{' '}
        <Link href="/account/sign-in" className="font-medium underline">
          Sign in
        </Link>
        .
      </p>
      <p className="text-xs leading-5 text-muted-foreground">
        We use your details to manage your account. Read our{' '}
        <Link href="/privacy" className="underline">
          privacy notice
        </Link>
        .
      </p>
    </form>
  )
}
