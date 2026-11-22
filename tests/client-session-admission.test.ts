import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createSessionAdmissionGate,
  isClientSessionAdmissionEnabled,
  isProfessionalSessionAdmissionEnabled,
  isProfessionalOnboardingEnabled,
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

test('professional admission has a separate local gate and preserves approval boundaries', () => {
  const pending = {
    ...base,
    marketplaceRole: 'professional' as const,
    professionalApproval: 'pending' as const,
  }
  assert.equal(mayCreateSession(pending, true), false)
  for (const professionalApproval of [
    'pending',
    'rejected',
    'approved',
  ] as const) {
    assert.equal(
      mayCreateSession({ ...pending, professionalApproval }, false, true),
      true,
    )
  }
  for (const change of [
    { emailVerified: false },
    { marketplaceStatus: 'suspended' as const },
    { marketplaceStatus: 'closed' as const },
    { administratorIsActive: false },
    { administratorIsActive: true },
    { professionalApproval: null },
    { marketplaceRole: 'client' as const },
  ]) {
    assert.equal(
      mayCreateSession({ ...pending, ...change }, false, true),
      false,
    )
  }
  assert.equal(mayCreateSession(base, false, true), false)
})

test('session hook admits a pending professional only when its separate gate is on', async () => {
  const pending = {
    ...base,
    marketplaceRole: 'professional' as const,
    professionalApproval: 'pending' as const,
  }
  const enabled = createSessionAdmissionGate({
    findState: async () => pending,
    clientEnabled: () => false,
    professionalEnabled: () => true,
  })
  const disabled = createSessionAdmissionGate({
    findState: async () => pending,
    clientEnabled: () => true,
    professionalEnabled: () => false,
  })
  assert.equal(await enabled({ userId: 'trusted-subject' }), undefined)
  assert.equal(await disabled({ userId: 'trusted-subject' }), false)
})

test('professional session switch defaults off and cannot turn on in Vercel', () => {
  assert.equal(
    isProfessionalSessionAdmissionEnabled({ NODE_ENV: 'development' }),
    false,
  )
  assert.equal(
    isProfessionalSessionAdmissionEnabled({
      NODE_ENV: 'development',
      MARKETPLACE_PROFESSIONAL_SESSION_ENABLED: 'true',
    }),
    false,
  )
  assert.equal(
    isProfessionalSessionAdmissionEnabled({
      NODE_ENV: 'development',
      MARKETPLACE_PROFESSIONAL_SESSION_ENABLED: 'true',
      ACCOUNT_RATE_LIMIT_ENABLED: 'true',
    }),
    true,
  )
  for (const env of [
    { NODE_ENV: 'production' },
    { NODE_ENV: 'development', VERCEL_ENV: 'preview' },
  ]) {
    assert.equal(
      isProfessionalSessionAdmissionEnabled({
        ...env,
        MARKETPLACE_PROFESSIONAL_SESSION_ENABLED: 'true',
        ACCOUNT_RATE_LIMIT_ENABLED: 'true',
      }),
      false,
    )
  }
})

test('onboarding cannot convert a client unless both local session gates and limiter are ready', () => {
  const ready = {
    NODE_ENV: 'development',
    ACCOUNT_RATE_LIMIT_ENABLED: 'true',
    MARKETPLACE_CLIENT_SESSION_ENABLED: 'true',
    MARKETPLACE_PROFESSIONAL_SESSION_ENABLED: 'true',
  }
  assert.equal(isProfessionalOnboardingEnabled(ready), true)
  assert.equal(
    isProfessionalOnboardingEnabled({
      ...ready,
      MARKETPLACE_PROFESSIONAL_SESSION_ENABLED: 'false',
    }),
    false,
  )
  assert.equal(
    isProfessionalOnboardingEnabled({
      ...ready,
      MARKETPLACE_CLIENT_SESSION_ENABLED: 'false',
    }),
    false,
  )
  assert.equal(
    isProfessionalOnboardingEnabled({ ...ready, VERCEL_ENV: 'preview' }),
    false,
  )
})

test('client session switch requires local flag and shared limiter, and cannot turn on in Vercel', () => {
  assert.equal(
    isClientSessionAdmissionEnabled({ NODE_ENV: 'development' }),
    false,
  )
  assert.equal(
    isClientSessionAdmissionEnabled({
      NODE_ENV: 'development',
      MARKETPLACE_CLIENT_SESSION_ENABLED: 'true',
    }),
    false,
  )
  assert.equal(
    isClientSessionAdmissionEnabled({
      NODE_ENV: 'development',
      MARKETPLACE_CLIENT_SESSION_ENABLED: 'true',
      ACCOUNT_RATE_LIMIT_ENABLED: 'true',
    }),
    true,
  )
  assert.equal(
    isClientSessionAdmissionEnabled({
      NODE_ENV: 'production',
      MARKETPLACE_CLIENT_SESSION_ENABLED: 'true',
      ACCOUNT_RATE_LIMIT_ENABLED: 'true',
    }),
    false,
  )
  assert.equal(
    isClientSessionAdmissionEnabled({
      NODE_ENV: 'development',
      VERCEL_ENV: 'preview',
      MARKETPLACE_CLIENT_SESSION_ENABLED: 'true',
      ACCOUNT_RATE_LIMIT_ENABLED: 'true',
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
