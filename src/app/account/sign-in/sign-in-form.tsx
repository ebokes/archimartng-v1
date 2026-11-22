'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authClient } from '@/lib/auth-browser'

export function ClientSignInForm({
  destination = '/account',
}: {
  destination?: '/account' | '/account/professional/status'
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setPending(true)
    setError('')
    const form = new FormData(event.currentTarget)
    try {
      const result = await authClient.signIn.email({
        email: String(form.get('email') ?? '').trim(),
        password: String(form.get('password') ?? ''),
      })
      if (result.error) {
        setError(
          'Sign in failed. Check your details, verify your email, or try again later.',
        )
        return
      }
      router.replace(destination)
      router.refresh()
    } catch {
      setError('Sign in is unavailable right now. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      <div className="space-y-2">
        <Label htmlFor="client-sign-in-email">Email address</Label>
        <Input
          id="client-sign-in-email"
          name="email"
          type="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          disabled={pending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="client-sign-in-password">Password</Label>
        <Input
          id="client-sign-in-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={pending}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  )
}
