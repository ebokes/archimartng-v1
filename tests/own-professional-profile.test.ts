import assert from 'node:assert/strict'
import test from 'node:test'
import { MarketplaceAccountAccessError } from '../src/lib/marketplace-account-authorization'
import {
  createMarketplaceAccountResolver,
  MarketplaceAccountServiceError,
  type ResolvedMarketplaceAccount,
} from '../src/lib/marketplace-account-resolver'
import {
  createOwnProfessionalProfileReader,
  type OwnProfessionalProfile,
} from '../src/lib/own-professional-profile-boundary'

const local = {
  NODE_ENV: 'development',
  ACCOUNT_RATE_LIMIT_ENABLED: 'true',
  MARKETPLACE_PROFESSIONAL_SESSION_ENABLED: 'true',
  MARKETPLACE_PROFESSIONAL_TEST_SUBJECT: 'owner-subject',
}

const account: ResolvedMarketplaceAccount = {
  id: 'owner-account',
  authSubject: 'owner-subject',
  role: 'professional',
  status: 'active',
  approvalStatus: 'approved',
  profileId: 'owned-profile',
}

const profile: OwnProfessionalProfile = {
  id: 'owned-profile',
  slug: 'private-draft',
  displayName: 'Test Professional',
  headline: 'Architect',
  bio: 'Approved biography',
  specialty: 'Architecture',
  city: null,
  state: null,
  country: null,
  websiteUrl: null,
  publicationStatus: 'draft',
  verificationStatus: 'unverified',
}

function approvedResolver(
  record: ResolvedMarketplaceAccount | null = account,
  options: {
    emailVerified?: boolean
    subject?: string | null
    administratorIsActive?: boolean | null
  } = {},
) {
  return createMarketplaceAccountResolver({
    getIdentity: async () =>
      options.subject === null
        ? null
        : {
            id: options.subject ?? 'owner-subject',
            emailVerified: options.emailVerified ?? true,
          },
    findAccount: async () =>
      record
        ? {
            account: record,
            administratorIsActive: options.administratorIsActive ?? null,
          }
        : undefined,
  }).requireApprovedProfessional
}

async function denied(action: () => Promise<unknown>, status: 401 | 403) {
  await assert.rejects(
    action(),
    (error) =>
      error instanceof MarketplaceAccountAccessError && error.status === status,
  )
}

test('owner can view a linked draft, archived or published profile', async () => {
  for (const publicationStatus of ['draft', 'archived', 'published'] as const) {
    const expected = { ...profile, publicationStatus }
    const reader = createOwnProfessionalProfileReader({
      requireApproved: approvedResolver(),
      async findOwned(accountId, profileId) {
        assert.equal(accountId, account.id)
        assert.equal(profileId, account.profileId)
        return { ownerAccountId: account.id, ...expected }
      },
    })
    assert.deepEqual(await reader(local), expected)
  }
})

test('approved professional without a linked profile sees a private empty state', async () => {
  let queries = 0
  const reader = createOwnProfessionalProfileReader({
    requireApproved: approvedResolver({ ...account, profileId: null }),
    async findOwned() {
      queries++
      return { ownerAccountId: account.id, ...profile }
    },
  })
  assert.equal(await reader(local), null)
  assert.equal(queries, 0)
})

test('disabled gate denies before session or profile lookup', async () => {
  let calls = 0
  const reader = createOwnProfessionalProfileReader({
    async requireApproved() {
      calls++
      return account
    },
    async findOwned() {
      calls++
      return { ownerAccountId: account.id, ...profile }
    },
  })
  for (const env of [
    {},
    { ...local, VERCEL_ENV: 'preview' },
    { ...local, NODE_ENV: 'production' },
    { ...local, MARKETPLACE_PROFESSIONAL_SESSION_ENABLED: 'false' },
  ]) {
    await denied(() => reader(env), 403)
  }
  assert.equal(calls, 0)
})

test('session, approval and account state must permit owner access', async () => {
  const deniedCases = [
    { record: account, options: { subject: null }, status: 401 },
    { record: null, options: {}, status: 403 },
    { record: account, options: { emailVerified: false }, status: 403 },
    { record: account, options: { administratorIsActive: false }, status: 403 },
    {
      record: { ...account, status: 'suspended' as const },
      options: {},
      status: 403,
    },
    {
      record: { ...account, status: 'closed' as const },
      options: {},
      status: 403,
    },
    {
      record: { ...account, approvalStatus: 'pending' as const },
      options: {},
      status: 403,
    },
    {
      record: { ...account, approvalStatus: 'rejected' as const },
      options: {},
      status: 403,
    },
    {
      record: { ...account, role: 'client' as const },
      options: {},
      status: 403,
    },
  ]
  for (const entry of deniedCases) {
    let queried = false
    const reader = createOwnProfessionalProfileReader({
      requireApproved: approvedResolver(entry.record, entry.options),
      async findOwned() {
        queried = true
        return { ownerAccountId: account.id, ...profile }
      },
    })
    await denied(() => reader(local), entry.status as 401 | 403)
    assert.equal(queried, false)
  }
})

test('different allowlisted subject, owner or profile cannot cross account boundary', async () => {
  const otherSubject = createOwnProfessionalProfileReader({
    requireApproved: approvedResolver({
      ...account,
      authSubject: 'other-subject',
    }),
    async findOwned() {
      throw new Error('must not query')
    },
  })
  await denied(() => otherSubject(local), 403)

  for (const row of [
    { ownerAccountId: 'other-account', ...profile },
    { ownerAccountId: account.id, ...profile, id: 'other-profile' },
    null,
  ]) {
    const reader = createOwnProfessionalProfileReader({
      requireApproved: approvedResolver(),
      async findOwned() {
        return row
      },
    })
    await denied(() => reader(local), 403)
  }
})

test('profile query failure exposes only a generic service error', async () => {
  const reader = createOwnProfessionalProfileReader({
    requireApproved: approvedResolver(),
    async findOwned() {
      throw new Error('private database details')
    },
  })
  await assert.rejects(
    reader(local),
    (error) =>
      error instanceof MarketplaceAccountServiceError &&
      error.message === 'Marketplace account temporarily unavailable',
  )
})
