import assert from 'node:assert/strict'
import { createHmac, randomUUID } from 'node:crypto'
import { config } from 'dotenv'
import postgres from 'postgres'
import { assertDevelopmentConnection } from '../src/db/development-branch'

config({ path: '.env.local', quiet: true })

const origin = 'http://localhost:3011'
let stage = 'preflight'

function hash(purpose: string, identity: string) {
  return createHmac('sha256', process.env.BETTER_AUTH_SECRET!)
    .update('archimart-rate-limit-v1\0')
    .update(purpose)
    .update('\0')
    .update(identity)
    .digest('hex')
}

async function post(path: string, body: object) {
  const response = await fetch(`${origin}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify(body),
    redirect: 'manual',
  })
  const text = await response.text()
  assert.doesNotMatch(
    text.toLowerCase(),
    /database_url|postgres|stack trace|secret|connection string/,
  )
  return {
    status: response.status,
    body: text,
    retryAfter: response.headers.get('retry-after'),
  }
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
    const suffix = randomUUID().replaceAll('-', '')
    const resetEmail = `reset-${suffix}@example.invalid`
    const verifyEmail = `verify-${suffix}@example.invalid`
    const loginEmail = `login-${suffix}@example.invalid`
    const [users] = await sql<{ count: number }[]>`
      SELECT count(*)::int AS count FROM auth.user
      WHERE email IN (${resetEmail}, ${verifyEmail}, ${loginEmail})
    `
    assert.equal(
      users.count,
      0,
      'Disposable addresses must not exist before testing.',
    )
    const [before] = await sql<{ count: number }[]>`
      SELECT count(*)::int AS count FROM public.account_rate_limits
    `

    stage = 'password reset initiation'
    const resets = []
    const resetCounts = []
    for (let i = 0; i < 4; i++) {
      resets.push(
        await post('/api/auth/request-password-reset', { email: resetEmail }),
      )
      const [count] = await sql<{ attempts: number }[]>`
        SELECT attempts FROM public.account_rate_limits
        WHERE key_hash = ${hash('password-reset-email', resetEmail)}
      `
      resetCounts.push(count?.attempts ?? 0)
    }
    console.log(
      `Reset initiation HTTP statuses/counts/kinds: ${resets.map((r) => r.status).join(',')} / ${resetCounts.join(',')} / ${resets.map((r) => (r.body === 'Too many requests' ? 'address' : r.status === 429 ? 'auth' : 'allowed')).join(',')}.`,
    )
    assert.ok(resets.slice(0, 3).every((r) => r.status === 200))
    assert.equal(resets[3].status, 429)
    assert.equal(resets[3].body, 'Too many requests')
    assert.ok(Number(resets[3].retryAfter) > 0)
    assert.ok(resets.every((r) => !r.body.includes(resetEmail)))

    stage = 'password reset counter'
    const [resetRow] = await sql<{ attempts: number }[]>`
      SELECT attempts FROM public.account_rate_limits
      WHERE key_hash = ${hash('password-reset-email', resetEmail)}
    `
    assert.equal(resetRow?.attempts, 4)
    // Only the uniquely generated test counter is changed.
    await sql`
      UPDATE public.account_rate_limits SET expires_at = now() - interval '1 second'
      WHERE key_hash = ${hash('password-reset-email', resetEmail)}
    `
    const resetAfterExpiry = await post('/api/auth/request-password-reset', {
      email: resetEmail,
    })
    assert.equal(resetAfterExpiry.status, 200)
    const [renewed] = await sql<{ attempts: number }[]>`
      SELECT attempts FROM public.account_rate_limits
      WHERE key_hash = ${hash('password-reset-email', resetEmail)}
    `
    assert.equal(renewed?.attempts, 1)

    stage = 'verification resend'
    const resends = await Promise.all(
      Array.from({ length: 4 }, () =>
        post('/api/auth/send-verification-email', { email: verifyEmail }),
      ),
    )
    assert.equal(resends.filter((r) => r.status === 429).length, 1)
    assert.equal(resends.filter((r) => r.status === 200).length, 3)
    assert.ok(
      resends
        .filter((r) => r.status === 429)
        .every((r) => r.body === 'Too many requests'),
    )
    assert.ok(resends.every((r) => !r.body.includes(verifyEmail)))

    stage = 'email sign-in'
    const signIns = await Promise.all(
      Array.from({ length: 6 }, () =>
        post('/api/auth/sign-in/email', {
          email: loginEmail,
          password: 'disposable-incorrect-password',
        }),
      ),
    )
    assert.equal(signIns.filter((r) => r.status === 429).length, 1)
    assert.equal(signIns.filter((r) => r.status === 401).length, 5)
    assert.ok(signIns.every((r) => !r.body.includes(loginEmail)))

    stage = 'admin access and final counts'
    const admin = await fetch(`${origin}/admin`, { redirect: 'manual' })
    assert.equal(admin.status, 307)
    assert.ok(admin.headers.get('location')?.startsWith('/admin/sign-in'))
    const [after] = await sql<{ count: number }[]>`
      SELECT count(*)::int AS count FROM public.account_rate_limits
    `
    const [usersAfter] = await sql<{ count: number }[]>`
      SELECT count(*)::int AS count FROM auth.user
      WHERE email IN (${resetEmail}, ${verifyEmail}, ${loginEmail})
    `
    assert.equal(usersAfter.count, 0)
    console.log(
      JSON.stringify({
        resetStatuses: resets.map((r) => r.status),
        resetAfterExpiry: resetAfterExpiry.status,
        resendStatuses: resends.map((r) => r.status).sort(),
        signInStatuses: signIns.map((r) => r.status).sort(),
        anonymousAdmin: admin.status,
        newCounterRows: after.count - before.count,
        newUsers: usersAfter.count,
      }),
    )
  } finally {
    await sql.end()
  }
}

main().catch((error: unknown) => {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : 'none'
  console.error(
    `Safe endpoint check failed at ${stage} (code ${code}); disposable hashed counters may remain.`,
  )
  process.exitCode = 1
})
