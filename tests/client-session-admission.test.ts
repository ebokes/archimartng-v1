import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createSessionAdmissionGate,
  isClientSessionAdmissionEnabled,
  mayCreateSession,
  isLegacyAdminSessionLookup,
  type SessionAdmissionState,
} from '../src/lib/client-session-admission'

const base: SessionAdmissionState = {
  emailVerified: true,
  administratorIsActive: null,
  marketplaceRole: 'client',
  marketplaceStatus: 'active',
  professionalApproval: null,
}

test('administrator admission preserves the allow-list and rejects overlap', () => {
  assert.equal(
    mayCreateSession(
      {
        ...base,
        administratorIsActive: true,
        marketplaceRole: null,
        marketplaceStatus: null,
      },
      false,
    ),
    true,
  )
  assert.equal(
    mayCreateSession(
      {
        ...base,
        emailVerified: false,
        administratorIsActive: true,
        marketplaceRole: null,
        marketplaceStatus: null,
      },
      false,
    ),
    true,
  )
  assert.equal(
    mayCreateSession(
      {
        ...base,
        administratorIsActive: false,
        marketplaceRole: null,
        marketplaceStatus: null,
      },
      true,
    ),
    false,
  )
  assert.equal(
    mayCreateSession({ ...base, administratorIsActive: true }, true),
    false,
  )
  assert.equal(
    mayCreateSession({ ...base, administratorIsActive: false }, true),
    false,
  )
})

test('client admission requires the local gate, verification, and consistent active state', () => {
  assert.equal(mayCreateSession(base, false), false)
  assert.equal(mayCreateSession(base, true), true)
  assert.equal(mayCreateSession({ ...base, emailVerified: false }, true), false)
  assert.equal(
    mayCreateSession({ ...base, marketplaceStatus: 'suspended' }, true),
    false,
  )
  assert.equal(
    mayCreateSession({ ...base, marketplaceStatus: 'closed' }, true),
    false,
  )
  assert.equal(
    mayCreateSession({ ...base, marketplaceRole: null }, true),
    false,
  )
  assert.equal(
    mayCreateSession(
      {
        ...base,
        marketplaceRole: 'professional',
        professionalApproval: 'pending',
      },
      true,
    ),
    false,
  )
  assert.equal(
    mayCreateSession({ ...base, professionalApproval: 'approved' }, true),
    false,
  )
  assert.equal(mayCreateSession(undefined, true), false)
})

test('client session switch cannot turn on in Vercel or without explicit local flag', () => {
  assert.equal(
    isClientSessionAdmissionEnabled({ NODE_ENV: 'development' }),
    false,
  )
  assert.equal(
    isClientSessionAdmissionEnabled({
      NODE_ENV: 'development',
      MARKETPLACE_CLIENT_SESSION_ENABLED: 'true',
    }),
    true,
  )
  assert.equal(
    isClientSessionAdmissionEnabled({
      NODE_ENV: 'production',
      MARKETPLACE_CLIENT_SESSION_ENABLED: 'true',
    }),
    false,
  )
  assert.equal(
    isClientSessionAdmissionEnabled({
      NODE_ENV: 'development',
      VERCEL_ENV: 'preview',
      MARKETPLACE_CLIENT_SESSION_ENABLED: 'true',
    }),
    false,
  )
  assert.equal(isLegacyAdminSessionLookup({ NODE_ENV: 'production' }), true)
  assert.equal(
    isLegacyAdminSessionLookup({
      NODE_ENV: 'development',
      VERCEL_ENV: 'preview',
    }),
    true,
  )
  assert.equal(isLegacyAdminSessionLookup({ NODE_ENV: 'development' }), false)
})

test('session hook uses Better Auth subject and denies lookup failures', async () => {
  let requested = ''
  const admitted = createSessionAdmissionGate({
    findState: async (subject) => {
      requested = subject
      return base
    },
    clientEnabled: () => true,
  })
  assert.equal(await admitted({ userId: 'trusted-subject' }), undefined)
  assert.equal(requested, 'trusted-subject')
  const failed = createSessionAdmissionGate({
    findState: async () => {
      throw new Error('private database detail')
    },
    clientEnabled: () => true,
  })
  assert.equal(await failed({ userId: 'trusted-subject' }), false)
})
