import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ClientAccountCreationError,
  createClientAccountCreationBoundary,
  type LockedClientIdentity,
} from '../src/lib/client-account-creation-boundary'

function harness(
  options: {
    authorized?: boolean
    exists?: boolean
    admin?: boolean
    role?: 'client' | 'professional'
    fail?: boolean
  } = {},
) {
  let account: { id: string; role: 'client' | 'professional' } | null =
    options.role ? { id: 'existing-id', role: options.role } : null
  let inserts = 0
  let lockedSubject: string | undefined
  // A fake row lock serializes concurrent transactions for the same identity.
  let queue = Promise.resolve()
  const lockedIdentity: LockedClientIdentity = {
    exists: options.exists !== false,
    hasAdministratorRecord: async () => options.admin === true,
    findMarketplaceAccount: async () => account,
    insertClientAccount: async () => {
      if (options.fail) throw new Error('database private detail')
      inserts += 1
      account = { id: 'new-id', role: 'client' }
      return account
    },
  }
  const create = createClientAccountCreationBoundary({
    getAuthorizedIdentity: async () =>
      options.authorized === false ? null : { subject: 'trusted-subject' },
    withLockedIdentity: async (subject, operation) => {
      lockedSubject = subject
      const previous = queue
      let release!: () => void
      queue = new Promise<void>((resolve) => {
        release = resolve
      })
      await previous
      try {
        return await operation(lockedIdentity)
      } finally {
        release()
      }
    },
  })
  return {
    create,
    get inserts() {
      return inserts
    },
    get lockedSubject() {
      return lockedSubject
    },
  }
}

async function denied(operation: () => Promise<unknown>) {
  await assert.rejects(
    operation(),
    (error) =>
      error instanceof ClientAccountCreationError &&
      error.message === 'Client account could not be created',
  )
}

test('trusted identity creates one client account and repeats return the same row', async () => {
  const h = harness()
  assert.equal(await h.create(), 'new-id')
  assert.equal(await h.create(), 'new-id')
  assert.equal(h.inserts, 1)
  assert.equal(h.lockedSubject, 'trusted-subject')
})

test('missing-row recovery uses only the authorized identity', async () => {
  const h = harness()
  assert.equal(await h.create(), 'new-id')
  assert.equal(h.inserts, 1)
})

test('no authorized identity or missing Better Auth user cannot create an account', async () => {
  const anonymous = harness({ authorized: false })
  await denied(anonymous.create)
  assert.equal(anonymous.lockedSubject, undefined)
  const missing = harness({ exists: false })
  await denied(missing.create)
  assert.equal(missing.inserts, 0)
})

test('all administrator records and professional roles block creation or conversion', async () => {
  for (const options of [
    { admin: true },
    { admin: true, role: 'client' as const },
    { role: 'professional' as const },
  ]) {
    const h = harness(options)
    await denied(h.create)
    assert.equal(h.inserts, 0)
  }
})

test('concurrent requests serialize and create only one client account', async () => {
  const h = harness()
  assert.deepEqual(await Promise.all([h.create(), h.create()]), [
    'new-id',
    'new-id',
  ])
  assert.equal(h.inserts, 1)
})

test('database failure and uniqueness errors never expose private details', async () => {
  const h = harness({ fail: true })
  await denied(h.create)
  assert.equal(h.inserts, 0)
  const lookup = createClientAccountCreationBoundary({
    getAuthorizedIdentity: async () => ({ subject: 'trusted-subject' }),
    withLockedIdentity: async () => {
      throw new Error('connection string and SQL')
    },
  })
  await denied(lookup)
})
