import 'server-only'

import { auth } from './auth'
import { isLocalClientRegistrationAvailable } from './client-registration-gate'
import { createMarketplaceAccountEmailRequests } from './marketplace-account-email-requests'
import {
  accountRateLimiter,
  isAccountRateLimitReady,
} from './account-rate-limit-store'

// Unmounted until the shared limiter, reset completion page, and rollout gate
// have been reviewed. Better Auth owns the tokens and their expiry.
export const marketplaceAccountEmailRequests =
  createMarketplaceAccountEmailRequests({
    available: () =>
      isLocalClientRegistrationAvailable() && isAccountRateLimitReady(),
    origin: process.env.BETTER_AUTH_URL ?? '',
    async sendVerification(email, callbackURL) {
      const decision = await accountRateLimiter()('verification-email', email, {
        windowSeconds: 3600,
        max: 3,
      })
      if (decision.allowed)
        await auth.api.sendVerificationEmail({ body: { email, callbackURL } })
    },
    async requestReset(email, redirectTo) {
      const decision = await accountRateLimiter()(
        'password-reset-email',
        email,
        { windowSeconds: 3600, max: 3 },
      )
      if (decision.allowed)
        await auth.api.requestPasswordReset({ body: { email, redirectTo } })
    },
  })
