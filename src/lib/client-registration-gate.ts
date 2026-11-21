import 'server-only'

import { readAuthEmailConfig } from './auth-email'
import { isClientRegistrationEnabled } from './client-registration'

export function isLocalClientRegistrationAvailable(
  env: Record<string, string | undefined> = process.env,
) {
  const email = readAuthEmailConfig(env)
  if (!email || email.environment !== 'development') return false
  if (email.origin !== env.BETTER_AUTH_URL) return false
  if (!['localhost', '127.0.0.1'].includes(new URL(email.origin).hostname))
    return false
  return isClientRegistrationEnabled(env, true)
}
