'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { authClient } from '@/lib/auth-browser'
import { readPasswordResetToken } from '@/lib/password-reset-token'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function PasswordResetForm() {
  const [token, setToken] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [pending, setPending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const capturedToken = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    if (capturedToken.current === undefined)
      capturedToken.current = readPasswordResetToken(window.location.search)
    // Remove the token from browser history after reading it into memory.
    window.history.replaceState(null, '', '/account/reset-password')
    const timer = window.setTimeout(() => {
      setToken(capturedToken.current ?? null)
      setReady(true)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token || pending) return
    const form = new FormData(event.currentTarget)
    const password = String(form.get('password') ?? '')
    const confirm = String(form.get('confirm') ?? '')
    if (password.length < 12 || password.length > 128 || password !== confirm) {
      setError('Use matching passwords of 12 to 128 characters.')
      return
    }
    setPending(true)
    setError('')
    try {
      const result = await authClient.resetPassword({
        newPassword: password,
        token,
      })
      if (result.error) throw new Error()
      setToken(null)
      setDone(true)
    } catch {
      setError('The reset link could not be used. Request a new link.')
    } finally {
      setPending(false)
    }
  }

  if (!ready) return null
  if (done)
    return (
      <p role="status" className="mt-8 text-sm">
        Password updated. You can now return to the{' '}
        <Link href="/" className="underline">
          home page
        </Link>
        .
      </p>
    )
  if (!token)
    return (
      <p role="alert" className="mt-8 text-sm text-destructive">
        This reset link is missing or invalid. Request a new link.
      </p>
    )
  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      <div className="space-y-2">
        <Label htmlFor="reset-password">New password</Label>
        <Input
          id="reset-password"
          name="password"
          type="password"
          minLength={12}
          maxLength={128}
          autoComplete="new-password"
          required
          disabled={pending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reset-confirm">Confirm password</Label>
        <Input
          id="reset-confirm"
          name="confirm"
          type="password"
          minLength={12}
          maxLength={128}
          autoComplete="new-password"
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
        {pending ? 'Updating…' : 'Update password'}
      </Button>
    </form>
  )
}
