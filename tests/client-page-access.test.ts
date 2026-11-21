import assert from 'node:assert/strict'
import test from 'node:test'
import { clientPageAccess } from '../src/lib/client-page-access'
import { MarketplaceAccountAccessError } from '../src/lib/marketplace-account-authorization'

const enabled = {
  NODE_ENV: 'development',
  MARKETPLACE_CLIENT_SESSION_ENABLED: 'true',
  ACCOUNT_RATE_LIMIT_ENABLED: 'true',
}

test('client dashboard checks the local gate before resolving a session', async () => {
  let calls = 0
  const resolve = async () => {
    calls++
    return { role: 'client' }
  }
  assert.deepEqual(await clientPageAccess(resolve, {}), { status: 'denied' })
  assert.deepEqual(
    await clientPageAccess(resolve, { ...enabled, VERCEL_ENV: 'preview' }),
    { status: 'denied' },
  )
  assert.equal(calls, 0)
  assert.deepEqual(await clientPageAccess(resolve, enabled), {
    status: 'allowed',
    account: { role: 'client' },
  })
  assert.equal(calls, 1)
})

test('anonymous clients go to sign-in; denied accounts stay out', async () => {
  assert.deepEqual(
    await clientPageAccess(async () => {
      throw new MarketplaceAccountAccessError(401)
    }, enabled),
    { status: 'sign-in' },
  )
  assert.deepEqual(
    await clientPageAccess(async () => {
      throw new MarketplaceAccountAccessError(403)
    }, enabled),
    { status: 'denied' },
  )
})

test('service failures are not converted to sign-in redirects', async () => {
  await assert.rejects(
    clientPageAccess(async () => {
      throw new Error('database unavailable')
    }, enabled),
    /database unavailable/,
  )
})
