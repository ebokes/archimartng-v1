import 'server-only'

import { z } from 'zod'

const emailSchema = z.email().max(254)

type EmailRequestDependencies = {
  available: () => boolean
  origin: string
  sendVerification: (email: string, callbackURL: string) => Promise<unknown>
  requestReset: (email: string, redirectTo: string) => Promise<unknown>
}

// Private preparation only. Do not mount either operation until a shared
// persistent rate limit protects the caller and the direct Better Auth paths.
export function createMarketplaceAccountEmailRequests(
  dependencies: EmailRequestDependencies,
) {
  async function request(
    kind: 'verification' | 'password-reset',
    value: string,
  ) {
    if (!dependencies.available()) return { status: 'unavailable' as const }
    const email = emailSchema.safeParse(value.trim().toLowerCase())
    if (!email.success) return { status: 'invalid' as const }

    try {
      const origin = new URL(dependencies.origin)
      if (
        !['http:', 'https:'].includes(origin.protocol) ||
        origin.pathname !== '/' ||
        origin.search ||
        origin.hash ||
        origin.username ||
        origin.password
      ) {
        return { status: 'unavailable' as const }
      }
      if (kind === 'verification') {
        await dependencies.sendVerification(email.data, '/')
      } else {
        await dependencies.requestReset(
          email.data,
          new URL('/account/reset-password', origin).toString(),
        )
      }
    } catch {
      // Unknown addresses and provider failures have the same public result.
    }
    return { status: 'accepted' as const }
  }

  return {
    resendVerification: (email: string) => request('verification', email),
    startPasswordRecovery: (email: string) => request('password-reset', email),
  }
}
