import assert from 'node:assert/strict'
import { createHmac, randomUUID } from 'node:crypto'
import { config } from 'dotenv'
import postgres from 'postgres'
import { assertDevelopmentConnection } from '../src/db/development-branch'

config({ path: '.env.local', quiet: true })

let stage = 'preflight'

async function main() {
  assertDevelopmentConnection(
    process.env.DATABASE_URL,
    process.env.DATABASE_URL_DIRECT,
    process.env.NEON_DEVELOPMENT_ENDPOINT_ID,
  )
  for (const name of [
    'ACCOUNT_RATE_LIMIT_ENABLED',
    'MARKETPLACE_CLIENT_REGISTRATION_ENABLED',
    'MARKETPLACE_CLIENT_SESSION_ENABLED',
  ]) {
    assert.notEqual(process.env[name], 'true', 'A V2 feature gate is enabled.')
  }

  const { createAccountRateLimiter } =
    await import('../src/lib/account-rate-limit')
  const { consumeAccountCounter } =
    await import('../src/lib/account-rate-limit-store')
  const secret = process.env.BETTER_AUTH_SECRET ?? ''
  const identity = `disposable-counter-${randomUUID()}`
  const purpose = 'development-postgres-check'
  const keyHash = createHmac('sha256', secret)
    .update('archimart-rate-limit-v1\0')
    .update(purpose)
    .update('\0')
    .update(identity)
    .digest('hex')
  const sql = postgres(process.env.DATABASE_URL_DIRECT!, {
    max: 1,
    prepare: false,
  })
  try {
    const rule = { windowSeconds: 60, max: 5 }
    stage = 'concurrent consume'
    let reportedStoreError = false
    const consume = createAccountRateLimiter(
      secret,
      async (key, requestedRule) => {
        try {
          return await consumeAccountCounter(key, requestedRule)
        } catch (error) {
          if (!reportedStoreError) {
            reportedStoreError = true
            const code =
              typeof error === 'object' && error !== null && 'code' in error
                ? String(error.code)
                : 'none'
            console.error(`Counter store failed (code ${code}).`)
          }
          throw error
        }
      },
    )
    const results = await Promise.all(
      Array.from({ length: 20 }, () => consume(purpose, identity, rule)),
    )
    assert.equal(results.filter((result) => result.allowed).length, 5)
    assert.equal(results.filter((result) => !result.allowed).length, 15)

    stage = 'inspect counter'
    const [row] = await sql<{ key_hash: string; attempts: number }[]>`
      SELECT key_hash, attempts FROM public.account_rate_limits WHERE key_hash = ${keyHash}
    `
    assert.match(row.key_hash, /^[a-f0-9]{64}$/)
    assert.notEqual(row.key_hash, identity)
    assert.equal(row.attempts, 6)

    // Change only this unique disposable fixture to simulate an expired window.
    stage = 'expire counter'
    await sql`
      UPDATE public.account_rate_limits SET expires_at = now() - interval '1 second'
      WHERE key_hash = ${keyHash}
    `
    stage = 'reset counter'
    assert.equal((await consume(purpose, identity, rule)).allowed, true)
    const [reset] = await sql<{ attempts: number }[]>`
      SELECT attempts FROM public.account_rate_limits WHERE key_hash = ${keyHash}
    `
    assert.equal(reset.attempts, 1)

    stage = 'fail closed'
    const failedStore = createAccountRateLimiter(secret, async () => {
      await sql`SELECT 1 / 0 AS deliberate_failure`
      throw new Error('Unexpected successful failure injection')
    })
    await assert.rejects(failedStore(purpose, identity, rule), {
      message: 'Rate limiter unavailable',
    })
    console.log(
      'PostgreSQL check passed: 20 concurrent calls yielded 5 allows and 15 blocks; count saturated, expiry reset, hashed key, and database-error fail-closed behavior verified. One disposable counter row remains.',
    )
  } finally {
    await sql.end()
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? String(error.code)
        : 'none'
    console.error(
      `PostgreSQL rate-limit check failed at ${stage} (code ${code}); inspect privately. A disposable counter row may remain.`,
    )
    process.exit(1)
  })
