import assert from 'node:assert/strict'
import test from 'node:test'
import {
  AuthEmailError,
  createAuthEmailDelivery,
  readAuthEmailConfig,
  renderAuthEmail,
} from '../src/lib/auth-email'

const development = {
  AUTH_EMAIL_ENV: 'development',
  AUTH_EMAIL_ORIGIN: 'http://localhost:3000',
  BETTER_AUTH_URL: 'http://localhost:3000',
  RESEND_API_KEY: 're_test_key',
  AUTH_EMAIL_FROM: 'Archimart <accounts@archimartng.com>',
  AUTH_EMAIL_REPLY_TO: 'archimartng@gmail.com',
}
const verification =
  'http://localhost:3000/api/auth/verify-email?token=sample-token&callbackURL=%2F'
const reset =
  'http://localhost:3000/api/auth/reset-password/sample-token?callbackURL=%2F'

async function expectCode(
  operation: () => Promise<unknown>,
  code: AuthEmailError['code'],
) {
  await assert.rejects(
    operation(),
    (error) =>
      error instanceof AuthEmailError &&
      error.code === code &&
      error.message === 'Account email unavailable',
  )
}

test('configuration requires all values and matching trusted origins', () => {
  assert.equal(readAuthEmailConfig(development)?.environment, 'development')
  for (const key of [
    'AUTH_EMAIL_ENV',
    'AUTH_EMAIL_ORIGIN',
    'BETTER_AUTH_URL',
    'RESEND_API_KEY',
    'AUTH_EMAIL_FROM',
    'AUTH_EMAIL_REPLY_TO',
  ] as const) {
    assert.equal(
      readAuthEmailConfig({ ...development, [key]: undefined }),
      null,
    )
  }
  assert.equal(
    readAuthEmailConfig({
      ...development,
      AUTH_EMAIL_ORIGIN: 'https://archimartng.com',
    }),
    null,
  )
  assert.equal(
    readAuthEmailConfig({ ...development, VERCEL_ENV: 'production' }),
    null,
  )
  assert.equal(
    readAuthEmailConfig({
      ...development,
      AUTH_EMAIL_ORIGIN: 'http://other.example',
      BETTER_AUTH_URL: 'http://other.example',
    }),
    null,
  )
})

test('production mail requires the canonical HTTPS origin and Vercel Production', () => {
  const production = {
    ...development,
    AUTH_EMAIL_ENV: 'production',
    AUTH_EMAIL_ORIGIN: 'https://archimartng.com',
    BETTER_AUTH_URL: 'https://archimartng.com',
    VERCEL_ENV: 'production',
  }
  assert.equal(
    readAuthEmailConfig(production)?.origin,
    'https://archimartng.com',
  )
  assert.equal(
    readAuthEmailConfig({ ...production, VERCEL_ENV: 'preview' }),
    null,
  )
  assert.equal(
    readAuthEmailConfig({
      ...production,
      AUTH_EMAIL_ORIGIN: 'https://www.archimartng.com',
    }),
    null,
  )
})

test('verification and recovery use Resend with responsive HTML and plain text', async () => {
  const calls: Array<{ url: string; init: RequestInit }> = []
  const transport: typeof fetch = async (input, init) => {
    calls.push({ url: String(input), init: init! })
    return new Response(null, { status: 200 })
  }
  const deliver = createAuthEmailDelivery(
    readAuthEmailConfig(development),
    transport,
  )
  await deliver(
    'verification',
    'recipient@example.com',
    verification,
    'sample-token',
  )
  await deliver(
    'password-reset',
    'recipient@example.com',
    reset,
    'sample-token',
  )
  assert.equal(calls.length, 2)
  for (const call of calls) {
    assert.equal(call.url, 'https://api.resend.com/emails')
    assert.equal(call.init.method, 'POST')
    const body = JSON.parse(String(call.init.body))
    assert.equal(body.from, development.AUTH_EMAIL_FROM)
    assert.equal(body.reply_to, development.AUTH_EMAIL_REPLY_TO)
    assert.deepEqual(body.to, ['recipient@example.com'])
    assert.match(body.html, /name="viewport"/)
    assert.match(body.text, /sample-token/)
  }
  assert.match(
    renderAuthEmail('verification', verification).html,
    /max-width:560px/,
  )
})

test('missing configuration and invalid links never call the provider', async () => {
  let called = false
  const transport: typeof fetch = async () => {
    called = true
    return new Response(null, { status: 200 })
  }
  await expectCode(
    () =>
      createAuthEmailDelivery(null, transport)(
        'verification',
        'recipient@example.com',
        verification,
        'sample-token',
      ),
    'NOT_CONFIGURED',
  )
  const deliver = createAuthEmailDelivery(
    readAuthEmailConfig(development),
    transport,
  )
  for (const link of [
    'https://archimartng.com/api/auth/verify-email?token=sample-token',
    'http://localhost:3000/api/auth/verify-email?token=wrong',
    'http://localhost:3000/api/auth/verify-email?token=sample-token&callbackURL=https%3A%2F%2Fevil.example',
    'http://localhost:3000/api/auth/verify-email?token=sample-token&callbackURL=%2F%2Fevil.example',
    'http://localhost:3000/api/auth/reset-password/sample-token',
  ]) {
    await expectCode(
      () =>
        deliver('verification', 'recipient@example.com', link, 'sample-token'),
      'INVALID_LINK',
    )
  }
  assert.equal(called, false)
})

test('provider rejection and network failure return only a generic delivery error', async () => {
  for (const transport of [
    async () => new Response('private provider details', { status: 429 }),
    async () => {
      throw new Error('private network details')
    },
  ] as Array<typeof fetch>) {
    const deliver = createAuthEmailDelivery(
      readAuthEmailConfig(development),
      transport,
    )
    await expectCode(
      () =>
        deliver(
          'password-reset',
          'recipient@example.com',
          reset,
          'sample-token',
        ),
      'DELIVERY_FAILED',
    )
  }
})
