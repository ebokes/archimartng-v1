'use server'

import { isLocalClientRegistrationAvailable } from '@/lib/client-registration-gate'
import { parseClientRegistrationForm } from '@/lib/client-registration-input'

export type RegistrationActionState = {
  status: 'idle' | 'invalid' | 'accepted' | 'unavailable' | 'error'
}

export async function registerClientAction(
  _state: RegistrationActionState,
  formData: FormData,
): Promise<RegistrationActionState> {
  // The action is directly callable even when its page is hidden.
  if (!isLocalClientRegistrationAvailable()) return { status: 'unavailable' }

  const parsed = parseClientRegistrationForm(formData)
  if (!parsed.success) return { status: 'invalid' }
  if (formData.get('companyWebsite')) return { status: 'accepted' }

  try {
    const { registerClientInTrustedFlow } =
      await import('@/lib/client-registration-server')
    await registerClientInTrustedFlow(parsed.data)
    // Never reveal whether the address was new, existing, or recoverable.
    return { status: 'accepted' }
  } catch {
    return { status: 'error' }
  }
}
