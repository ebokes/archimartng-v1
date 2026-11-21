import assert from 'node:assert/strict'
import test from 'node:test'
import { createMarketplaceAccountEmailRequests } from '../src/lib/marketplace-account-email-requests'

function setup(available = true, origin = 'http://localhost:3000') {
  const calls: string[] = []
  const requests = createMarketplaceAccountEmailRequests({
    available: () => available,
    origin,
    async sendVerification(_email, callback) {
      calls.push(`verification:${callback}`)
    },
    async requestReset(_email, redirect) {
      calls.push(`reset:${redirect}`)
    },
  })
  return { calls, requests }
}

test('disabled gate makes no Better Auth call', async () => {
  const { calls, requests } = setup(false)
  assert.deepEqual(await requests.resendVerification('test@example.com'), {
    status: 'unavailable',
  })
  assert.deepEqual(await requests.startPasswordRecovery('test@example.com'), {
    status: 'unavailable',
  })
  assert.deepEqual(calls, [])
})

test('resend uses a fixed callback and reset uses the trusted origin', async () => {
  const { calls, requests } = setup()
  assert.deepEqual(await requests.resendVerification('TEST@example.com'), {
    status: 'accepted',
  })
  assert.deepEqual(await requests.startPasswordRecovery('test@example.com'), {
    status: 'accepted',
  })
  assert.deepEqual(calls, [
    'verification:/',
    'reset:http://localhost:3000/account/reset-password',
  ])
})

test('invalid addresses and origins cannot trigger a send', async () => {
  const invalidEmail = setup()
  assert.deepEqual(
    await invalidEmail.requests.resendVerification('not-an-email'),
    { status: 'invalid' },
  )
  assert.deepEqual(invalidEmail.calls, [])
  const invalidOrigin = setup(true, 'https://example.com/unsafe')
  assert.deepEqual(
    await invalidOrigin.requests.startPasswordRecovery('test@example.com'),
    { status: 'unavailable' },
  )
  assert.deepEqual(invalidOrigin.calls, [])
})

test('provider failures do not reveal account or provider details', async () => {
  const requests = createMarketplaceAccountEmailRequests({
    available: () => true,
    origin: 'http://localhost:3000',
    sendVerification: async () => {
      throw new Error('provider details')
    },
    requestReset: async () => {
      throw new Error('account details')
    },
  })
  assert.deepEqual(await requests.resendVerification('test@example.com'), {
    status: 'accepted',
  })
  assert.deepEqual(await requests.startPasswordRecovery('test@example.com'), {
    status: 'accepted',
  })
})
