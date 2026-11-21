import 'server-only'

import { sql } from 'drizzle-orm'
import { authDb } from '@/db/auth-client'
import { createAccountRateLimiter, type LimitRule } from './account-rate-limit'

// One PostgreSQL statement performs the read, window rollover, and increment.
// ON CONFLICT locks the counter row, so simultaneous requests cannot read the
// same old value. The value saturates at max + 1 until the window expires.
export async function consumeAccountCounter(keyHash: string, rule: LimitRule) {
  const rows = await authDb.execute<{
    attempts: number
    expires_at: Date | string
  }>(sql`
    INSERT INTO account_rate_limits (key_hash, attempts, window_started_at, expires_at)
    VALUES (${keyHash}, 1, now(), now() + ${rule.windowSeconds} * interval '1 second')
    ON CONFLICT (key_hash) DO UPDATE SET
      attempts = CASE
        WHEN account_rate_limits.expires_at <= now() THEN 1
        ELSE least(account_rate_limits.attempts + 1, ${rule.max + 1})
      END,
      window_started_at = CASE
        WHEN account_rate_limits.expires_at <= now() THEN now()
        ELSE account_rate_limits.window_started_at
      END,
      expires_at = CASE
        WHEN account_rate_limits.expires_at <= now()
          THEN now() + ${rule.windowSeconds} * interval '1 second'
        ELSE account_rate_limits.expires_at
      END
    RETURNING attempts, expires_at
  `)
  const row = rows[0]
  if (!row) throw new Error('Rate limiter unavailable')
  const expiresAt = new Date(row.expires_at)
  if (!Number.isFinite(expiresAt.getTime()))
    throw new Error('Rate limiter unavailable')
  return { attempts: row.attempts, expiresAt }
}

export function isAccountRateLimitReady(
  env: Record<string, string | undefined> = process.env,
) {
  return env.ACCOUNT_RATE_LIMIT_ENABLED === 'true'
}

export function accountRateLimiter() {
  if (!isAccountRateLimitReady()) throw new Error('Rate limiter unavailable')
  return createAccountRateLimiter(
    process.env.BETTER_AUTH_SECRET ?? '',
    consumeAccountCounter,
  )
}

export function betterAuthRateLimitStorage() {
  return {
    consume: async (key: string, rule: { window: number; max: number }) =>
      accountRateLimiter()('better-auth', key, {
        windowSeconds: rule.window,
        max: rule.max,
      }),
  }
}
