'use server'

import { isLocalClientRegistrationAvailable } from '@/lib/client-registration-gate'
import { parseClientRegistrationForm } from '@/lib/client-registration-input'
import { trustedClientAddress } from '@/lib/account-rate-limit-client'
import { headers } from 'next/headers'

export type RegistrationActionState = {
  status: 'idle' | 'invalid' | 'accepted' | 'unavailable' | 'limited' | 'error'
}

export async function registerClientAction(
  _state: RegistrationActionState,
  formData: FormData,
): Promise<RegistrationActionState> {
  // The action is directly callable even when its page is hidden.
  if (!isLocalClientRegistrationAvailable()) return { status: 'unavailable' }
  // Never activate account writes until migration 0004 and the shared
  // counter have been separately approved and enabled.
  if (process.env.ACCOUNT_RATE_LIMIT_ENABLED !== 'true')
    return { status: 'unavailable' }

  const parsed = parseClientRegistrationForm(formData)
  if (!parsed.success) return { status: 'invalid' }
  if (formData.get('companyWebsite')) return { status: 'accepted' }

  try {
    const { accountRateLimiter } =
      await import('@/lib/account-rate-limit-store')
    const ip = trustedClientAddress(await headers(), process.env)
    if (!ip) return { status: 'unavailable' }
    const consume = accountRateLimiter()
    const ipLimit = await consume('registration-ip', ip, {
      windowSeconds: 3600,
      max: 5,
    })
    const emailLimit = await consume('registration-email', parsed.data.email, {
      windowSeconds: 3600,
      max: 3,
    })
    if (!ipLimit.allowed || !emailLimit.allowed) return { status: 'limited' }
    const { registerClientInTrustedFlow } =
      await import('@/lib/client-registration-server')
    await registerClientInTrustedFlow(parsed.data)
    // Never reveal whether the address was new, existing, or recoverable.
    return { status: 'accepted' }
  } catch {
    return { status: 'error' }
  }
}
