import assert from 'node:assert/strict'
import test from 'node:test'
import { createProtectedAuthPost } from '../src/lib/protected-auth-post'

function request(path: string) {
  return new Request(`https://example.test${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'person@example.test' }),
  })
}

test('direct resend and reset requests count independent email budgets', async () => {
  const calls: string[] = []
  const post = createProtectedAuthPost(
    async () => new Response('ok'),
    () => true,
    async (purpose, email) => {
      calls.push(`${purpose}:${email}`)
      return { allowed: true, retryAfter: null }
    },
  )
  assert.equal(
    (await post(request('/api/auth/send-verification-email'))).status,
    200,
  )
  assert.equal(
    (await post(request('/api/auth/request-password-reset'))).status,
    200,
  )
  assert.deepEqual(calls, [
    'verification-email:person@example.test',
    'password-reset-email:person@example.test',
  ])
})

test('excess direct requests are blocked before Better Auth', async () => {
  let handled = false
  const post = createProtectedAuthPost(
    async () => {
      handled = true
      return new Response('ok')
    },
    () => true,
    async () => ({ allowed: false, retryAfter: 12 }),
  )
  const result = await post(request('/api/auth/request-password-reset'))
  assert.equal(result.status, 429)
  assert.equal(result.headers.get('Retry-After'), '12')
  assert.equal(handled, false)
})

test('storage failure denies a direct request without exposing details', async () => {
  const post = createProtectedAuthPost(
    async () => new Response('ok'),
    () => true,
    async () => {
      throw new Error('private database detail')
    },
  )
  const result = await post(request('/api/auth/send-verification-email'))
  assert.equal(result.status, 503)
  assert.equal((await result.text()).includes('private'), false)
})

test('disabled integration preserves existing handler behavior', async () => {
  const post = createProtectedAuthPost(
    async () => new Response('existing', { status: 202 }),
    () => false,
    async () => {
      throw new Error('must not run')
    },
  )
  assert.equal(
    (await post(request('/api/auth/request-password-reset'))).status,
    202,
  )
})
