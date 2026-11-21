import 'server-only'

import { MarketplaceAccountAccessError } from './marketplace-account-authorization'
import { isClientSessionAdmissionEnabled } from './client-session-admission'

export async function clientPageAccess<T>(
  requireClient: () => Promise<T>,
  env: Record<string, string | undefined> = process.env,
): Promise<
  { status: 'allowed'; account: T } | { status: 'sign-in' | 'denied' }
> {
  if (!isClientSessionAdmissionEnabled(env)) return { status: 'denied' }
  try {
    return { status: 'allowed', account: await requireClient() }
  } catch (error) {
    if (error instanceof MarketplaceAccountAccessError) {
      return { status: error.status === 401 ? 'sign-in' : 'denied' }
    }
    throw error
  }
}
