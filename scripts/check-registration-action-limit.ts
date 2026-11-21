import assert from 'node:assert/strict'
import { createHmac, randomUUID } from 'node:crypto'
import { config } from 'dotenv'
import postgres from 'postgres'
import { assertDevelopmentConnection } from '../src/db/development-branch'

config({ path: '.env.local', quiet: true })

const origin = 'http://localhost:3011'

function decodeAttribute(value: string) {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&#x27;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&')
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
  const secret = process.env.BETTER_AUTH_SECRET!
  const keyHash = createHmac('sha256', secret)
    .update('archimart-rate-limit-v1\0')
    .update('registration-ip')
    .update('\0')
    .update('local-development')
    .digest('hex')
  const email = `blocked-${randomUUID().replaceAll('-', '')}@example.invalid`
  const sql = postgres(process.env.DATABASE_URL_DIRECT!, {
    max: 1,
    prepare: false,
  })
  try {
    const [before] = await sql<{ count: number }[]>`
      SELECT count(*)::int AS count FROM auth.user WHERE email = ${email}
    `
    assert.equal(before.count, 0)
    const [existing] = await sql<{ attempts: number; live: boolean }[]>`
      SELECT attempts, expires_at > now() AS live
      FROM public.account_rate_limits WHERE key_hash = ${keyHash}
    `
    if (existing?.live)
      throw new Error('Local registration test bucket is already active.')

    const { consumeAccountCounter } =
      await import('../src/lib/account-rate-limit-store')
    for (let i = 0; i < 5; i++) {
      await consumeAccountCounter(keyHash, { windowSeconds: 3600, max: 5 })
    }
    const [armed] = await sql<{ attempts: number; live: boolean }[]>`
      SELECT attempts, expires_at > now() AS live
      FROM public.account_rate_limits WHERE key_hash = ${keyHash}
    `
    assert.equal(armed.attempts, 5)
    assert.equal(armed.live, true)

    const page = await fetch(`${origin}/account/register`)
    assert.equal(page.status, 200)
    const html = await page.text()
    const form = html.match(/<form[^>]*>[\s\S]*?<\/form>/)?.[0]
    assert.ok(form)
    const hidden = [...form.matchAll(/<input[^>]*type="hidden"[^>]*>/g)]
    assert.ok(hidden.length >= 2)
    const formData = new FormData()
    for (const [tag] of hidden) {
      const name = tag.match(/name="([^"]+)"/)?.[1]
      const value = tag.match(/value="([^"]*)"/)?.[1] ?? ''
      if (name) formData.append(decodeAttribute(name), decodeAttribute(value))
    }
    formData.append('name', 'Disposable test')
    formData.append('email', email)
    formData.append('password', 'disposable-test-password-12345')
    formData.append('companyWebsite', '')

    const responses = await Promise.all(
      Array.from({ length: 3 }, () =>
        fetch(`${origin}/account/register`, {
          method: 'POST',
          headers: { Origin: origin },
          body: formData,
          redirect: 'manual',
        }),
      ),
    )
    const bodies = await Promise.all(
      responses.map((response) => response.text()),
    )
    assert.ok(bodies.every((body) => body.includes('Too many requests')))
    assert.ok(bodies.every((body) => !body.includes(email)))
    assert.ok(
      bodies.every(
        (body) => !/DATABASE_URL|postgres|connection string/i.test(body),
      ),
    )
    const [after] = await sql<{ count: number }[]>`
      SELECT count(*)::int AS count FROM auth.user WHERE email = ${email}
    `
    assert.equal(after.count, 0)
    const [counter] = await sql<{ attempts: number }[]>`
      SELECT attempts FROM public.account_rate_limits WHERE key_hash = ${keyHash}
    `
    assert.equal(counter.attempts, 6)
    const directSignUp = await fetch(`${origin}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: origin },
      body: JSON.stringify({
        name: 'Disposable test',
        email,
        password: 'disposable-test-password-12345',
      }),
    })
    assert.equal(directSignUp.status, 404)
    console.log(
      JSON.stringify({
        registrationPage: page.status,
        blockedActionStatuses: responses.map((response) => response.status),
        blockedMessageShown: true,
        concurrentRequestsBlocked: responses.length,
        directSignUp: directSignUp.status,
        newUsers: after.count,
        counterSaturatedAt: counter.attempts,
      }),
    )
  } finally {
    await sql.end()
  }
}

main()
  .then(() => process.exit(0))
  .catch(() => {
    console.error(
      'Registration action limit check failed; a disposable hashed counter may remain.',
    )
    process.exit(1)
  })
