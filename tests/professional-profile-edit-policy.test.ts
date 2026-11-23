import assert from 'node:assert/strict'
import test from 'node:test'
import { MarketplaceAccountAccessError } from '../src/lib/marketplace-account-authorization'
import {
  createMarketplaceAccountResolver,
  MarketplaceAccountServiceError,
  type ResolvedMarketplaceAccount,
} from '../src/lib/marketplace-account-resolver'
import {
  createProfessionalProfileEditPolicy,
  ProfessionalProfileEditError,
} from '../src/lib/professional-profile-edit-policy'

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

function approvedResolver(
  record: ResolvedMarketplaceAccount | null = account,
  options: {
    subject?: string | null
    emailVerified?: boolean
    administratorIsActive?: boolean | null
  } = {},
) {
  return createMarketplaceAccountResolver({
    getIdentity: async () =>
      options.subject === null
        ? null
        : {
            id: options.subject ?? account.authSubject,
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

function policy(
  record: ResolvedMarketplaceAccount | null = account,
  ownerAccountId = account.id,
) {
  return createProfessionalProfileEditPolicy({
    requireApproved: approvedResolver(record),
    async findOwnership(accountId, profileId) {
      assert.equal(accountId, account.id)
      assert.equal(profileId, account.profileId)
      return {
        ownerAccountId,
        profileId,
        publicationStatus: 'draft',
      }
    },
  })
}

test('only supported owner-editable fields are returned for every publication state', async () => {
  for (const publicationStatus of ['draft', 'archived', 'published'] as const) {
    const edit = createProfessionalProfileEditPolicy({
      requireApproved: approvedResolver(),
      async findOwnership() {
        return {
          ownerAccountId: account.id,
          profileId: account.profileId!,
          publicationStatus,
        }
      },
    })
    assert.deepEqual(
      await edit(
        {
          bio: 'An updated professional biography.',
          websiteUrl: 'https://example.com/portfolio',
          city: ' Lagos ',
          state: '',
          country: 'Nigeria',
        },
        local,
      ),
      {
        accountId: account.id,
        profileId: account.profileId,
        changes: {
          bio: 'An updated professional biography.',
          websiteUrl: 'https://example.com/portfolio',
          city: 'Lagos',
          state: null,
          country: 'Nigeria',
        },
      },
    )
  }
})

test('a subset is valid and clearing optional website or location produces null', async () => {
  assert.deepEqual(await policy()({ websiteUrl: '', city: '' }, local), {
    accountId: account.id,
    profileId: account.profileId,
    changes: { websiteUrl: null, city: null },
  })
})

test('administrator-controlled, unsupported and identity fields are denied', async () => {
  const forbiddenFields = [
    'displayName',
    'headline',
    'specialty',
    'contactEmail',
    'contactPhone',
    'registrationNumber',
    'licenceDetails',
    'portfolioDescription',
    'publicationStatus',
    'publishedAt',
    'verificationStatus',
    'verifiedAt',
    'verifiedByAdminId',
    'profileId',
    'ownerAccountId',
    'authSubject',
    'role',
    'slug',
  ]
  for (const field of forbiddenFields) {
    await assert.rejects(
      policy()({ [field]: 'forged' }, local),
      (error) =>
        error instanceof ProfessionalProfileEditError &&
        error.code === 'invalid_input',
      field,
    )
  }
})

test('mixed payloads fail as a whole rather than silently dropping denied fields', async () => {
  for (const input of [
    {
      bio: 'An updated professional biography.',
      publicationStatus: 'published',
    },
    { city: 'Lagos', profileId: 'other-profile' },
    { websiteUrl: 'https://example.com', role: 'administrator' },
  ]) {
    await assert.rejects(
      policy()(input, local),
      (error) =>
        error instanceof ProfessionalProfileEditError &&
        error.code === 'invalid_input',
    )
  }
})

test('empty and invalid values fail without creating an edit plan', async () => {
  for (const input of [
    {},
    null,
    [],
    { bio: 'Too short' },
    { websiteUrl: 'http://example.com' },
    { websiteUrl: 'not-a-url' },
    { city: 'x'.repeat(121) },
  ]) {
    await assert.rejects(
      policy()(input, local),
      (error) =>
        error instanceof ProfessionalProfileEditError &&
        error.code === 'invalid_input',
    )
  }
})

test('missing, mismatched or unrelated ownership denies all edits', async () => {
  await assert.rejects(
    policy({ ...account, profileId: null })(
      { bio: 'An updated biography for a professional.' },
      local,
    ),
    (error) =>
      error instanceof ProfessionalProfileEditError &&
      error.code === 'forbidden',
  )
  await assert.rejects(
    policy(account, 'other-account')(
      { bio: 'An updated biography for a professional.' },
      local,
    ),
    (error) =>
      error instanceof ProfessionalProfileEditError &&
      error.code === 'forbidden',
  )
  for (const ownership of [
    null,
    {
      ownerAccountId: account.id,
      profileId: 'other-profile',
      publicationStatus: 'draft' as const,
    },
  ]) {
    const edit = createProfessionalProfileEditPolicy({
      requireApproved: approvedResolver(),
      findOwnership: async () => ownership,
    })
    await assert.rejects(
      edit({ city: 'Lagos' }, local),
      (error) =>
        error instanceof ProfessionalProfileEditError &&
        error.code === 'forbidden',
    )
  }
})

test('anonymous, client, pending, rejected, suspended, closed and unverified accounts deny before ownership lookup', async () => {
  const cases = [
    { record: account, options: { subject: null } },
    { record: null, options: {} },
    { record: account, options: { emailVerified: false } },
    { record: account, options: { administratorIsActive: false } },
    { record: { ...account, role: 'client' as const }, options: {} },
    { record: { ...account, approvalStatus: 'pending' as const }, options: {} },
    {
      record: { ...account, approvalStatus: 'rejected' as const },
      options: {},
    },
    { record: { ...account, status: 'suspended' as const }, options: {} },
    { record: { ...account, status: 'closed' as const }, options: {} },
  ]
  for (const entry of cases) {
    let ownershipLookups = 0
    const edit = createProfessionalProfileEditPolicy({
      requireApproved: approvedResolver(entry.record, entry.options),
      async findOwnership() {
        ownershipLookups++
        return {
          ownerAccountId: account.id,
          profileId: account.profileId!,
          publicationStatus: 'published',
        }
      },
    })
    await assert.rejects(
      edit({ city: 'Lagos' }, local),
      MarketplaceAccountAccessError,
    )
    assert.equal(ownershipLookups, 0)
  }
})

test('the local gate and subject allowlist deny before ownership lookup', async () => {
  let calls = 0
  const edit = createProfessionalProfileEditPolicy({
    async requireApproved() {
      calls++
      return account
    },
    async findOwnership() {
      calls++
      return {
        ownerAccountId: account.id,
        profileId: account.profileId!,
        publicationStatus: 'draft',
      }
    },
  })
  for (const env of [
    {},
    { ...local, NODE_ENV: 'production' },
    { ...local, VERCEL_ENV: 'preview' },
    { ...local, MARKETPLACE_PROFESSIONAL_SESSION_ENABLED: 'false' },
  ]) {
    await assert.rejects(
      edit({ city: 'Lagos' }, env),
      MarketplaceAccountAccessError,
    )
  }
  assert.equal(calls, 0)

  const mismatched = createProfessionalProfileEditPolicy({
    requireApproved: async () => ({
      ...account,
      authSubject: 'different-subject',
    }),
    async findOwnership() {
      calls++
      return null
    },
  })
  await assert.rejects(
    mismatched({ city: 'Lagos' }, local),
    MarketplaceAccountAccessError,
  )
  assert.equal(calls, 0)
})

test('storage failure hides database details', async () => {
  const edit = createProfessionalProfileEditPolicy({
    requireApproved: approvedResolver(),
    async findOwnership() {
      throw new Error('private connection details')
    },
  })
  await assert.rejects(
    edit({ city: 'Lagos' }, local),
    (error) =>
      error instanceof MarketplaceAccountServiceError &&
      error.message === 'Marketplace account temporarily unavailable',
  )
})
