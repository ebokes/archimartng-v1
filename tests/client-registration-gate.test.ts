import assert from 'node:assert/strict'
import test from 'node:test'
import { isLocalClientRegistrationAvailable } from '../src/lib/client-registration-gate'
import { parseClientRegistrationForm } from '../src/lib/client-registration-input'
import { registerClientAction } from '../src/app/account/register/actions'

const ready = {
  NODE_ENV: 'development',
  MARKETPLACE_CLIENT_REGISTRATION_ENABLED: 'true',
  AUTH_EMAIL_ENV: 'development',
  AUTH_EMAIL_ORIGIN: 'http://localhost:3000',
  BETTER_AUTH_URL: 'http://localhost:3000',
  RESEND_API_KEY: 're_testplaceholder',
  AUTH_EMAIL_FROM: 'Archimart <accounts@archimartng.com>',
  AUTH_EMAIL_REPLY_TO: 'archimartng@gmail.com',
}

test('registration gate requires explicit local switch and matching development mail', () => {
  assert.equal(isLocalClientRegistrationAvailable(ready), true)
  assert.equal(
    isLocalClientRegistrationAvailable({
      ...ready,
      MARKETPLACE_CLIENT_REGISTRATION_ENABLED: 'false',
    }),
    false,
  )
  assert.equal(
    isLocalClientRegistrationAvailable({ ...ready, VERCEL_ENV: 'preview' }),
    false,
  )
  assert.equal(
    isLocalClientRegistrationAvailable({
      ...ready,
      NODE_ENV: 'production',
      VERCEL_ENV: 'production',
    }),
    false,
  )
  assert.equal(
    isLocalClientRegistrationAvailable({
      ...ready,
      AUTH_EMAIL_ORIGIN: 'https://archimartng.com',
    }),
    false,
  )
  assert.equal(
    isLocalClientRegistrationAvailable({
      ...ready,
      BETTER_AUTH_URL: 'http://localhost:3001',
    }),
    false,
  )
  assert.equal(
    isLocalClientRegistrationAvailable({ ...ready, RESEND_API_KEY: undefined }),
    false,
  )
})

test('registration input rejects invalid or oversized fields without exposing account existence', () => {
  const valid = new FormData()
  valid.set('name', 'Client')
  valid.set('email', 'client@example.com')
  valid.set('password', 'long-private-password')
  assert.equal(parseClientRegistrationForm(valid).success, true)
  valid.set('password', 'short')
  assert.equal(parseClientRegistrationForm(valid).success, false)
  valid.set('password', 'long-private-password')
  valid.set('email', 'invalid')
  assert.equal(parseClientRegistrationForm(valid).success, false)
})

test('direct server-action call is unavailable while registration gate is off', async () => {
  const previous = process.env.MARKETPLACE_CLIENT_REGISTRATION_ENABLED
  process.env.MARKETPLACE_CLIENT_REGISTRATION_ENABLED = 'false'
  try {
    assert.deepEqual(
      await registerClientAction({ status: 'idle' }, new FormData()),
      { status: 'unavailable' },
    )
  } finally {
    if (previous === undefined)
      delete process.env.MARKETPLACE_CLIENT_REGISTRATION_ENABLED
    else process.env.MARKETPLACE_CLIENT_REGISTRATION_ENABLED = previous
  }
})
