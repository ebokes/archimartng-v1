import { toNextJsHandler } from 'better-auth/next-js'
import { auth } from '@/lib/auth'
import {
  accountRateLimiter,
  isAccountRateLimitReady,
} from '@/lib/account-rate-limit-store'
import { createProtectedAuthPost } from '@/lib/protected-auth-post'

export const runtime = 'nodejs'
const handler = toNextJsHandler(auth)
export const GET = handler.GET

// Better Auth's shared IP counter protects all mounted HTTP requests when
// enabled. Add an independent per-address budget for the two email initiators
// so direct calls cannot bypass a future UI action's address ceiling.
export const POST = createProtectedAuthPost(
  handler.POST,
  isAccountRateLimitReady,
  (purpose, email) =>
    accountRateLimiter()(purpose, email, { windowSeconds: 3600, max: 3 }),
)
