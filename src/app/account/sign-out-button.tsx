'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-browser'

export function ClientSignOutButton({
  destination = '/account/sign-in',
}: {
  destination?: '/account/sign-in' | '/account/professional/sign-in'
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(false)

  async function signOut() {
    if (pending) return
    setPending(true)
    setError(false)
    try {
      const result = await authClient.signOut()
      if (result.error) {
        setError(true)
        return
      }
      router.replace(destination)
      router.refresh()
    } catch {
      setError(true)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span role="alert" className="text-xs text-destructive">
          Could not sign out. Try again.
        </span>
      )}
      <Button variant="outline" size="sm" disabled={pending} onClick={signOut}>
        {pending ? 'Signing out…' : 'Sign out'}
      </Button>
    </div>
  )
}
