import assert from 'node:assert/strict'
import test from 'node:test'
import {
  MarketplaceAccountAccessError,
  type MarketplaceIdentity,
} from '../src/lib/marketplace-account-authorization'
import {
  createMarketplaceAccountResolver,
  MarketplaceAccountServiceError,
  type MarketplaceAccountLookup,
  type ResolvedMarketplaceAccount,
} from '../src/lib/marketplace-account-resolver'

const identity: MarketplaceIdentity = {
  id: 'auth-subject',
  emailVerified: true,
}
const client: ResolvedMarketplaceAccount = {
  id: 'account-id',
  authSubject: identity.id,
  role: 'client',
  status: 'active',
  approvalStatus: null,
  profileId: null,
}
const pending: ResolvedMarketplaceAccount = {
  ...client,
  role: 'professional',
  approvalStatus: 'pending',
}
const approved: ResolvedMarketplaceAccount = {
  ...pending,
  approvalStatus: 'approved',
  profileId: 'profile-id',
}

function resolver(
  account: ResolvedMarketplaceAccount | undefined,
  administratorIsActive: boolean | null = null,
) {
  return createMarketplaceAccountResolver({
    getIdentity: async () => identity,
    findAccount: async (subject): Promise<MarketplaceAccountLookup> => {
      assert.equal(subject, identity.id)
      return account ? { account, administratorIsActive } : undefined
    },
  })
}

async function expectDenied(
  attempt: () => Promise<unknown>,
  status: 401 | 403,
) {
  await assert.rejects(
    attempt(),
    (error) =>
      error instanceof MarketplaceAccountAccessError &&
      error.status === status &&
      error.message === (status === 401 ? 'Unauthorized' : 'Forbidden'),
  )
}

test('valid clients and professionals receive only their permitted access', async () => {
  assert.deepEqual(await resolver(client).requireClient(), client)
  assert.deepEqual(
    await resolver(pending).requireProfessionalOnboarding(),
    pending,
  )
  assert.deepEqual(
    await resolver({
      ...pending,
      approvalStatus: 'rejected',
    }).requireProfessionalOnboarding(),
    { ...pending, approvalStatus: 'rejected' },
  )
  assert.deepEqual(
    await resolver(approved).requireApprovedProfessional(),
    approved,
  )

  await expectDenied(() => resolver(client).requireApprovedProfessional(), 403)
  await expectDenied(() => resolver(pending).requireApprovedProfessional(), 403)
  await expectDenied(
    () => resolver(approved).requireProfessionalOnboarding(),
    403,
  )
  await expectDenied(() => resolver(approved).requireClient(), 403)
})

test('missing sessions, missing accounts and unverified email fail closed', async () => {
  let lookups = 0
  for (const user of [null, { ...identity, emailVerified: false }]) {
    const access = createMarketplaceAccountResolver({
      getIdentity: async () => user,
      findAccount: async () => {
        lookups += 1
        return { account: client, administratorIsActive: null }
      },
    })
    await expectDenied(() => access.requireClient(), user ? 403 : 401)
  }
  assert.equal(lookups, 0)
  await expectDenied(() => resolver(undefined).requireClient(), 403)
})

test('both active and inactive administrator overlaps deny marketplace access', async () => {
  for (const isActive of [true, false]) {
    await expectDenied(() => resolver(client, isActive).requireClient(), 403)
    await expectDenied(
      () => resolver(approved, isActive).requireApprovedProfessional(),
      403,
    )
  }
})

test('suspended and closed accounts deny every access level', async () => {
  for (const status of ['suspended', 'closed'] as const) {
    await expectDenied(
      () => resolver({ ...client, status }).requireClient(),
      403,
    )
    await expectDenied(
      () => resolver({ ...pending, status }).requireProfessionalOnboarding(),
      403,
    )
    await expectDenied(
      () => resolver({ ...approved, status }).requireApprovedProfessional(),
      403,
    )
  }
})

test('subject and role/approval inconsistencies deny access', async () => {
  await expectDenied(
    () => resolver({ ...client, authSubject: 'other-subject' }).requireClient(),
    403,
  )
  await expectDenied(
    () => resolver({ ...client, approvalStatus: 'approved' }).requireClient(),
    403,
  )
  await expectDenied(
    () =>
      resolver({
        ...pending,
        approvalStatus: null,
      }).requireProfessionalOnboarding(),
    403,
  )
  await expectDenied(
    () =>
      resolver({ ...pending, role: 'client' }).requireProfessionalOnboarding(),
    403,
  )
  await expectDenied(
    () =>
      resolver({
        ...client,
        status: 'unknown',
      } as unknown as ResolvedMarketplaceAccount).requireClient(),
    403,
  )
})

test('client-supplied role and approval cannot override database state', async () => {
  const forgedIdentity = {
    ...identity,
    role: 'professional',
    approvalStatus: 'approved',
  }
  const access = createMarketplaceAccountResolver({
    getIdentity: async () => forgedIdentity,
    findAccount: async () => ({
      account: pending,
      administratorIsActive: null,
    }),
  })
  await expectDenied(() => access.requireApprovedProfessional(), 403)
})

test('session and database failures expose only a generic service error', async () => {
  for (const dependencies of [
    {
      getIdentity: async () => {
        throw new Error('session secret and connection details')
      },
      findAccount: async () => ({
        account: client,
        administratorIsActive: null,
      }),
    },
    {
      getIdentity: async () => identity,
      findAccount: async () => {
        throw new Error('database connection details')
      },
    },
  ]) {
    await assert.rejects(
      createMarketplaceAccountResolver(dependencies).requireClient(),
      (error) =>
        error instanceof MarketplaceAccountServiceError &&
        error.status === 503 &&
        error.message === 'Marketplace account temporarily unavailable',
    )
  }
})
