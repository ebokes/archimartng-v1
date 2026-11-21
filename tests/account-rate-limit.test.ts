import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createAccountRateLimiter,
  type AtomicCounter,
} from '../src/lib/account-rate-limit'
import { trustedClientAddress } from '../src/lib/account-rate-limit-client'

const secret = 'a'.repeat(32)

function fixture() {
  let clock = new Date('2026-11-21T00:00:00.000Z')
  const rows = new Map<string, { attempts: number; expiresAt: Date }>()
  const consumeAtomic: AtomicCounter = async (key, rule) => {
    const old = rows.get(key)
    const row =
      !old || old.expiresAt <= clock
        ? {
            attempts: 1,
            expiresAt: new Date(clock.getTime() + rule.windowSeconds * 1000),
          }
        : {
            attempts: Math.min(old.attempts + 1, rule.max + 1),
            expiresAt: old.expiresAt,
          }
    rows.set(key, row)
    return row
  }
  return {
    rows,
    consume: createAccountRateLimiter(secret, consumeAtomic, () => clock),
    advance(seconds: number) {
      clock = new Date(clock.getTime() + seconds * 1000)
    },
  }
}

test('permits up to the limit, rejects excess, and resets after expiry', async () => {
  const { consume, advance } = fixture()
  const rule = { windowSeconds: 60, max: 2 }
  assert.deepEqual(await consume('registration', 'shared-ip', rule), {
    allowed: true,
    retryAfter: null,
  })
  assert.deepEqual(await consume('registration', 'shared-ip', rule), {
    allowed: true,
    retryAfter: null,
  })
  assert.deepEqual(await consume('registration', 'shared-ip', rule), {
    allowed: false,
    retryAfter: 60,
  })
  advance(60)
  assert.deepEqual(await consume('registration', 'shared-ip', rule), {
    allowed: true,
    retryAfter: null,
  })
})

test('purpose and identity have separate hashed counters', async () => {
  const { consume, rows } = fixture()
  const rule = { windowSeconds: 60, max: 1 }
  await consume('registration-ip', 'same', rule)
  assert.equal((await consume('registration-ip', 'same', rule)).allowed, false)
  assert.equal(
    (await consume('registration-email', 'same', rule)).allowed,
    true,
  )
  assert.equal((await consume('registration-ip', 'other', rule)).allowed, true)
  assert.equal(rows.size, 3)
  for (const key of rows.keys()) {
    assert.match(key, /^[a-f0-9]{64}$/)
    assert.equal(key.includes('same'), false)
  }
})

test('parallel attempts cannot pass a saturated atomic store', async () => {
  const { consume } = fixture()
  const results = await Promise.all(
    Array.from({ length: 20 }, () =>
      consume('reset-email', 'same', { windowSeconds: 60, max: 3 }),
    ),
  )
  assert.equal(results.filter((result) => result.allowed).length, 3)
})

test('storage errors and malformed rules fail closed', async () => {
  const consume = createAccountRateLimiter(secret, async () => {
    throw new Error('database details')
  })
  await assert.rejects(
    consume('registration', 'key', { windowSeconds: 60, max: 1 }),
    { message: 'Rate limiter unavailable' },
  )
  await assert.rejects(
    consume('registration', 'key', { windowSeconds: 0, max: 1 }),
    { message: 'Rate limiter unavailable' },
  )
})

test('only Vercel-provided address or a local shared bucket is trusted', () => {
  const headers = new Headers({ 'x-vercel-forwarded-for': '192.0.2.1' })
  assert.equal(
    trustedClientAddress(headers, { VERCEL_ENV: 'preview' }),
    '192.0.2.1',
  )
  assert.equal(
    trustedClientAddress(headers, { NODE_ENV: 'development' }),
    'local-development',
  )
  assert.equal(trustedClientAddress(headers, { NODE_ENV: 'production' }), null)
  assert.equal(
    trustedClientAddress(
      new Headers({ 'x-vercel-forwarded-for': '192.0.2.1, 192.0.2.2' }),
      { VERCEL_ENV: 'production' },
    ),
    null,
  )
})
