'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-browser'

export function SignOutButton() {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function signOut() {
    if (pending) return
    setPending(true)
    setError('')
    try {
      const result = await authClient.signOut()
      if (result.error) {
        setError('Could not sign out. Please try again.')
        return
      }
      router.replace('/admin/sign-in')
      router.refresh()
    } catch {
      setError('Could not sign out. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
      <Button variant="outline" size="sm" onClick={signOut} disabled={pending}>
        {pending ? 'Signing out…' : 'Sign out'}
      </Button>
    </div>
  )
}
