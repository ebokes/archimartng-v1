import 'server-only'

import { createHmac } from 'node:crypto'

export type LimitRule = { windowSeconds: number; max: number }
export type LimitDecision =
  { allowed: true; retryAfter: null } | { allowed: false; retryAfter: number }

export type AtomicCounter = (
  keyHash: string,
  rule: LimitRule,
) => Promise<{ attempts: number; expiresAt: Date }>

export function createAccountRateLimiter(
  secret: string,
  consumeAtomic: AtomicCounter,
  now: () => Date = () => new Date(),
) {
  if (secret.length < 32) throw new Error('Rate limiter unavailable')

  return async function consume(
    purpose: string,
    identity: string,
    rule: LimitRule,
  ): Promise<LimitDecision> {
    if (
      !purpose ||
      !identity ||
      !Number.isSafeInteger(rule.windowSeconds) ||
      rule.windowSeconds < 1 ||
      rule.windowSeconds > 86400 ||
      !Number.isSafeInteger(rule.max) ||
      rule.max < 1 ||
      rule.max > 1000
    ) {
      throw new Error('Rate limiter unavailable')
    }
    const keyHash = createHmac('sha256', secret)
      .update('archimart-rate-limit-v1\0')
      .update(purpose)
      .update('\0')
      .update(identity)
      .digest('hex')
    try {
      const row = await consumeAtomic(keyHash, rule)
      if (!Number.isInteger(row.attempts) || !(row.expiresAt instanceof Date))
        throw new Error()
      if (row.attempts <= rule.max) return { allowed: true, retryAfter: null }
      return {
        allowed: false,
        retryAfter: Math.max(
          1,
          Math.ceil((row.expiresAt.getTime() - now().getTime()) / 1000),
        ),
      }
    } catch {
      // A storage failure must never permit account creation or email sends.
      throw new Error('Rate limiter unavailable')
    }
  }
}
