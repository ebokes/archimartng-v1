import 'server-only'

import { auth } from './auth'
import { isLocalClientRegistrationAvailable } from './client-registration-gate'
import { createMarketplaceAccountEmailRequests } from './marketplace-account-email-requests'

// Unmounted until the shared limiter, reset completion page, and rollout gate
// have been reviewed. Better Auth owns the tokens and their expiry.
export const marketplaceAccountEmailRequests =
  createMarketplaceAccountEmailRequests({
    available: isLocalClientRegistrationAvailable,
    origin: process.env.BETTER_AUTH_URL ?? '',
    sendVerification: (email, callbackURL) =>
      auth.api.sendVerificationEmail({ body: { email, callbackURL } }),
    requestReset: (email, redirectTo) =>
      auth.api.requestPasswordReset({ body: { email, redirectTo } }),
  })
