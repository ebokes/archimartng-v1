import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import test from 'node:test'

test('mounted Better Auth handler rejects a direct email sign-up request', async () => {
  // A deliberately unusable local URL prevents an accidental database write
  // even if the sign-up guard regresses. The request body has no valid user.
  Object.assign(process.env, {
    DATABASE_URL: 'postgresql://localhost/unused',
    DATABASE_URL_DIRECT: 'postgresql://localhost/unused',
    NODE_ENV: 'production',
    BETTER_AUTH_URL: 'http://localhost:3000',
    BETTER_AUTH_SECRET: randomBytes(32).toString('hex'),
  })

  const { auth } = await import('../src/lib/auth')
  assert.equal(auth.options.emailAndPassword?.disableSignUp, true)
  assert.ok(auth.options.disabledPaths?.includes('/sign-up/email'))
  const response = await auth.handler(
    new Request('http://localhost:3000/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    }),
  )
  assert.equal(response.status, 404)

  // Better Auth rejects malformed verification tokens before any user lookup.
  await assert.rejects(
    auth.api.verifyEmail({ query: { token: 'invalid' } }),
    (error: unknown) =>
      error instanceof Error &&
      'status' in error &&
      error.status === 'UNAUTHORIZED',
  )
})
