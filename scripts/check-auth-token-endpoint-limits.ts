import assert from 'node:assert/strict'
import { createHmac, randomUUID } from 'node:crypto'
import { config } from 'dotenv'
import postgres from 'postgres'
import { assertDevelopmentConnection } from '../src/db/development-branch'

config({ path: '.env.local', quiet: true })

const origin = 'http://localhost:3011'

function keyFor(path: string) {
  return createHmac('sha256', process.env.BETTER_AUTH_SECRET!)
    .update('archimart-rate-limit-v1\0')
    .update('better-auth')
    .update('\0')
    .update(`127.0.0.1|${path}`)
    .digest('hex')
}

async function main() {
  assertDevelopmentConnection(
    process.env.DATABASE_URL,
    process.env.DATABASE_URL_DIRECT,
    process.env.NEON_DEVELOPMENT_ENDPOINT_ID,
  )
  assert.notEqual(process.env.ACCOUNT_RATE_LIMIT_ENABLED, 'true')
  assert.notEqual(process.env.MARKETPLACE_CLIENT_REGISTRATION_ENABLED, 'true')
  assert.notEqual(process.env.MARKETPLACE_CLIENT_SESSION_ENABLED, 'true')
  const sql = postgres(process.env.DATABASE_URL_DIRECT!, {
    max: 1,
    prepare: false,
  })
  try {
    const paths = ['/reset-password', '/verify-email']
    const [existing] = await sql<{ count: number }[]>`
      SELECT count(*)::int AS count FROM public.account_rate_limits
      WHERE key_hash IN (${keyFor(paths[0])}, ${keyFor(paths[1])})
    `
    assert.equal(existing.count, 0, 'Token endpoint counters must be fresh.')
    const [usersBefore] = await sql<{ count: number }[]>`
      SELECT count(*)::int AS count FROM auth.user
    `
    const [tokensBefore] = await sql<{ count: number }[]>`
      SELECT count(*)::int AS count FROM auth.verification
    `
    const invalidToken = `invalid-${randomUUID()}`
    const reset = await Promise.all(
      Array.from({ length: 11 }, () =>
        fetch(`${origin}/api/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Origin: origin },
          body: JSON.stringify({
            token: invalidToken,
            newPassword: 'disposable-test-password-12345',
          }),
          redirect: 'manual',
        }),
      ),
    )
    const verify = await Promise.all(
      Array.from({ length: 21 }, () =>
        fetch(`${origin}/api/auth/verify-email?token=${invalidToken}`, {
          redirect: 'manual',
        }),
      ),
    )
    assert.equal(reset.filter((response) => response.status === 429).length, 1)
    assert.equal(verify.filter((response) => response.status === 429).length, 1)
    for (const response of [...reset, ...verify]) {
      const body = await response.text()
      assert.ok(!body.includes(invalidToken))
      assert.doesNotMatch(
        body,
        /DATABASE_URL|postgres|connection string|secret/i,
      )
    }
    const rows = await sql<{ key_hash: string; attempts: number }[]>`
      SELECT key_hash, attempts FROM public.account_rate_limits
      WHERE key_hash IN (${keyFor(paths[0])}, ${keyFor(paths[1])})
    `
    assert.equal(rows.length, 2)
    assert.equal(
      rows.find((row) => row.key_hash === keyFor(paths[0]))?.attempts,
      11,
    )
    assert.equal(
      rows.find((row) => row.key_hash === keyFor(paths[1]))?.attempts,
      21,
    )
    const [usersAfter] = await sql<{ count: number }[]>`
      SELECT count(*)::int AS count FROM auth.user
    `
    const [tokensAfter] = await sql<{ count: number }[]>`
      SELECT count(*)::int AS count FROM auth.verification
    `
    assert.equal(usersAfter.count, usersBefore.count)
    assert.equal(tokensAfter.count, tokensBefore.count)
    console.log(
      JSON.stringify({
        resetAttempts: reset.length,
        resetBlocked: reset.filter((response) => response.status === 429)
          .length,
        verifyAttempts: verify.length,
        verifyBlocked: verify.filter((response) => response.status === 429)
          .length,
        newUsers: usersAfter.count - usersBefore.count,
        newVerificationRows: tokensAfter.count - tokensBefore.count,
        disposableCounterRows: rows.length,
      }),
    )
  } finally {
    await sql.end()
  }
}

main().catch(() => {
  console.error(
    'Safe token-endpoint limit check failed; disposable hashed counters may remain.',
  )
  process.exitCode = 1
})
