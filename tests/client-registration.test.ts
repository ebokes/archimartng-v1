import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ClientRegistrationDisabledError,
  createClientRegistration,
  isClientRegistrationEnabled,
  type ClientRegistrationInput,
} from '../src/lib/client-registration'
import { createClientAccountCreationBoundary } from '../src/lib/client-account-creation-boundary'
import {
  authorizeClientAccount,
  MarketplaceAccountAccessError,
} from '../src/lib/marketplace-account-authorization'

const input: ClientRegistrationInput = {
  email: 'client@example.com',
  name: 'Client',
  password: 'long-private-password',
}

function harness(
  options: {
    admin?: boolean
    existingRole?: 'professional'
    failAccountOnce?: boolean
  } = {},
) {
  let identityExists = false
  let marker = false
  let account: { id: string; role: 'client' | 'professional' } | null =
    options.existingRole
      ? { id: 'professional-id', role: options.existingRole }
      : null
  let creations = 0
  let verificationRequests = 0
  let fail = options.failAccountOnce === true
  let queue = Promise.resolve()
  const register = createClientRegistration({
    enabled: () => true,
    async createIdentity(received) {
      assert.deepEqual(received, input)
      if (identityExists) return { kind: 'existing' }
      identityExists = true
      return { kind: 'created', subject: 'auth-subject' }
    },
    async markRecoverable(subject) {
      assert.equal(subject, 'auth-subject')
      marker = true
    },
    async recoverIdentity(email, password) {
      assert.equal(email, input.email)
      return marker && password === input.password ? 'auth-subject' : null
    },
    async createClientAccount(subject) {
      if (fail) {
        fail = false
        throw new Error('private database failure')
      }
      const boundary = createClientAccountCreationBoundary({
        getAuthorizedIdentity: async () => ({ subject }),
        withLockedIdentity: async (_subject, operation) => {
          const previous = queue
          let release!: () => void
          queue = new Promise<void>((resolve) => {
            release = resolve
          })
          await previous
          try {
            return await operation({
              exists: true,
              hasAdministratorRecord: async () => options.admin === true,
              findMarketplaceAccount: async () => account,
              insertClientAccount: async () => {
                creations += 1
                account = { id: 'client-id', role: 'client' }
                return account
              },
            })
          } finally {
            release()
          }
        },
      })
      return boundary()
    },
    async clearRecoveryMarker() {
      marker = false
    },
    async sendVerification() {
      verificationRequests += 1
    },
  })
  return {
    register,
    get account() {
      return account
    },
    get marker() {
      return marker
    },
    get creations() {
      return creations
    },
    get verificationRequests() {
      return verificationRequests
    },
  }
}

test('new identity creates a client row; duplicate attempts do not create another', async () => {
  const h = harness()
  assert.deepEqual(await h.register(input), { accepted: true })
  assert.deepEqual(h.account, { id: 'client-id', role: 'client' })
  assert.equal(h.creations, 1)
  assert.equal(h.verificationRequests, 1)
  assert.deepEqual(await h.register(input), { accepted: true })
  assert.equal(h.creations, 1)
})

test('partial account failure leaves a marker; credential-proven retry recovers once', async () => {
  const h = harness({ failAccountOnce: true })
  assert.deepEqual(await h.register(input), { accepted: true })
  assert.equal(h.account, null)
  assert.equal(h.marker, true)
  await assert.rejects(
    authorizeClientAccount(
      { id: 'auth-subject', emailVerified: true },
      async () => undefined,
    ),
    MarketplaceAccountAccessError,
  )
  await h.register({ ...input, password: 'incorrect-password' })
  assert.equal(h.account, null)
  await h.register(input)
  await h.register(input)
  assert.equal(h.creations, 1)
  assert.equal(h.verificationRequests, 1)
  assert.equal(h.marker, false)
})

test('inactive or active administrator membership blocks client creation', async () => {
  const h = harness({ admin: true })
  assert.deepEqual(await h.register(input), { accepted: true })
  assert.equal(h.account, null)
  assert.equal(h.verificationRequests, 0)
})

test('professional accounts cannot be converted and request role fields are ignored', async () => {
  const h = harness({ existingRole: 'professional' })
  await h.register({
    ...input,
    role: 'professional',
    approvalStatus: 'approved',
    isAdmin: true,
  } as ClientRegistrationInput)
  assert.equal(h.creations, 0)
  assert.deepEqual(h.account, { id: 'professional-id', role: 'professional' })
})

test('concurrent registration attempts cannot create duplicate marketplace rows', async () => {
  const h = harness()
  await Promise.all([h.register(input), h.register(input)])
  assert.equal(h.creations, 1)
})

test('missing or invalid email receives the same generic result without identity creation', async () => {
  let called = false
  const register = createClientRegistration({
    enabled: () => true,
    createIdentity: async () => {
      called = true
      throw new Error()
    },
    markRecoverable: async () => {},
    recoverIdentity: async () => null,
    createClientAccount: async () => '',
    clearRecoveryMarker: async () => {},
    sendVerification: async () => {},
  })
  for (const email of ['', 'invalid']) {
    assert.deepEqual(await register({ ...input, email }), { accepted: true })
  }
  assert.equal(called, false)
})

test('unverified email cannot access even an active client row', async () => {
  await assert.rejects(
    authorizeClientAccount(
      { id: 'auth-subject', emailVerified: false },
      async () => ({
        authSubject: 'auth-subject',
        role: 'client',
        status: 'active',
        approvalStatus: null,
      }),
    ),
    MarketplaceAccountAccessError,
  )
})

test('registration gate is disabled by default and never opens in Production', async () => {
  assert.equal(isClientRegistrationEnabled({}, true), false)
  assert.equal(
    isClientRegistrationEnabled(
      {
        MARKETPLACE_CLIENT_REGISTRATION_ENABLED: 'true',
        NODE_ENV: 'production',
      },
      true,
    ),
    false,
  )
  assert.equal(
    isClientRegistrationEnabled(
      {
        MARKETPLACE_CLIENT_REGISTRATION_ENABLED: 'true',
        NODE_ENV: 'development',
      },
      true,
    ),
    true,
  )
  assert.equal(
    isClientRegistrationEnabled(
      {
        MARKETPLACE_CLIENT_REGISTRATION_ENABLED: 'true',
        VERCEL_ENV: 'preview',
      },
      true,
    ),
    false,
  )
  assert.equal(
    isClientRegistrationEnabled(
      {
        MARKETPLACE_CLIENT_REGISTRATION_ENABLED: 'true',
        VERCEL_ENV: 'production',
      },
      true,
    ),
    false,
  )
  assert.equal(
    isClientRegistrationEnabled(
      { MARKETPLACE_CLIENT_REGISTRATION_ENABLED: 'true' },
      false,
    ),
    false,
  )
  const register = createClientRegistration({
    enabled: () => false,
    createIdentity: async () => {
      throw new Error('must not be called')
    },
    markRecoverable: async () => {},
    recoverIdentity: async () => null,
    createClientAccount: async () => '',
    clearRecoveryMarker: async () => {},
    sendVerification: async () => {},
  })
  await assert.rejects(register(input), ClientRegistrationDisabledError)
})

test('identity failure and duplicate responses are indistinguishable to the caller', async () => {
  for (const createIdentity of [
    async () => ({ kind: 'existing' as const }),
    async () => {
      throw new Error('User already exists for private address')
    },
  ]) {
    const register = createClientRegistration({
      enabled: () => true,
      createIdentity,
      markRecoverable: async () => {},
      recoverIdentity: async () => null,
      createClientAccount: async () => {
        throw new Error('must not run')
      },
      clearRecoveryMarker: async () => {},
      sendVerification: async () => {},
    })
    assert.deepEqual(await register(input), { accepted: true })
  }
})

test('shared identity lock prevents concurrent admin and marketplace membership', async () => {
  for (const adminFirst of [true, false]) {
    let administrator = false
    let marketplace = false
    let queue = Promise.resolve()
    async function locked<T>(operation: () => Promise<T>): Promise<T> {
      const previous = queue
      let release!: () => void
      queue = new Promise<void>((resolve) => {
        release = resolve
      })
      await previous
      try {
        return await operation()
      } finally {
        release()
      }
    }
    const createClient = createClientAccountCreationBoundary({
      getAuthorizedIdentity: async () => ({ subject: 'auth-subject' }),
      withLockedIdentity: async (_subject, operation) =>
        locked(() =>
          operation({
            exists: true,
            hasAdministratorRecord: async () => administrator,
            findMarketplaceAccount: async () =>
              marketplace ? { id: 'client-id', role: 'client' } : null,
            insertClientAccount: async () => {
              marketplace = true
              return { id: 'client-id' }
            },
          }),
        ),
    })
    const provision = () =>
      locked(async () => {
        if (marketplace || administrator) return false
        administrator = true
        return true
      })
    await Promise.allSettled(
      adminFirst
        ? [provision(), createClient()]
        : [createClient(), provision()],
    )
    assert.notEqual(administrator, marketplace)
  }
})
