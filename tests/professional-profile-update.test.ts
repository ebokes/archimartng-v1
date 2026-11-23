import assert from 'node:assert/strict'
import test from 'node:test'
import { MarketplaceAccountAccessError } from '../src/lib/marketplace-account-authorization'
import { MarketplaceAccountServiceError } from '../src/lib/marketplace-account-resolver'
import { ProfessionalProfileEditError } from '../src/lib/professional-profile-edit-policy'
import {
  createProfessionalProfileUpdateBoundary,
  type LockedProfessionalProfileState,
} from '../src/lib/professional-profile-update-boundary'

const local = {
  NODE_ENV: 'development',
  ACCOUNT_RATE_LIMIT_ENABLED: 'true',
  MARKETPLACE_PROFESSIONAL_SESSION_ENABLED: 'true',
  MARKETPLACE_PROFESSIONAL_TEST_SUBJECT: 'owner-subject',
}

const approved = {
  id: 'owner-account',
  authSubject: 'owner-subject',
  profileId: 'owned-profile',
}
const state = {
  ...approved,
  emailVerified: true,
  hasAdministratorRecord: false,
  role: 'professional' as const,
  status: 'active' as const,
  approvalStatus: 'approved' as const,
  ownerAccountId: approved.id,
  publicationStatus: 'draft' as const,
}

function fixture(
  options: {
    locked?: LockedProfessionalProfileState | null
    initial?: typeof approved
    updateFailure?: boolean
    updateSucceeded?: boolean
    gate?: Record<string, string | undefined>
  } = {},
) {
  const calls: Array<{ profileId: string; changes: Record<string, unknown> }> =
    []
  let committed = false
  let rolledBack = false
  const update = createProfessionalProfileUpdateBoundary({
    requireApproved: async () => options.initial ?? approved,
    async withLockedProfile(accountId, operation) {
      assert.equal(accountId, approved.id)
      try {
        const result = await operation({
          findState: async () =>
            options.locked === undefined ? state : options.locked,
          async updateProfile(profileId, changes) {
            calls.push({ profileId, changes })
            if (options.updateFailure)
              throw new Error('private database details')
            return options.updateSucceeded ?? true
          },
        })
        committed = true
        return result
      } catch (error) {
        rolledBack = true
        calls.length = 0
        throw error
      }
    },
  })
  return {
    run: (changes: unknown) => update(changes, options.gate ?? local),
    calls,
    get committed() {
      return committed
    },
    get rolledBack() {
      return rolledBack
    },
  }
}

test('each allowed field writes only its normalized value and stored profile', async () => {
  for (const [input, output] of [
    [
      { bio: 'A professional biography with enough detail.' },
      { bio: 'A professional biography with enough detail.' },
    ],
    [
      { websiteUrl: 'https://example.com/portfolio' },
      { websiteUrl: 'https://example.com/portfolio' },
    ],
    [{ city: ' Lagos ' }, { city: 'Lagos' }],
    [{ state: 'Lagos' }, { state: 'Lagos' }],
    [{ country: 'Nigeria' }, { country: 'Nigeria' }],
  ] as const) {
    const f = fixture()
    await f.run(input)
    assert.deepEqual(f.calls, [
      { profileId: approved.profileId, changes: output },
    ])
    assert.equal(f.committed, true)
  }
})

test('multiple fields can update for owned draft, archived and published profiles', async () => {
  for (const publicationStatus of ['draft', 'archived', 'published'] as const) {
    const f = fixture({ locked: { ...state, publicationStatus } })
    await f.run({
      bio: 'Updated professional biography.',
      websiteUrl: '',
      city: '',
      state: 'Lagos',
      country: 'Nigeria',
    })
    assert.deepEqual(f.calls, [
      {
        profileId: approved.profileId,
        changes: {
          bio: 'Updated professional biography.',
          websiteUrl: null,
          city: null,
          state: 'Lagos',
          country: 'Nigeria',
        },
      },
    ])
    assert.equal('publicationStatus' in f.calls[0].changes, false)
    assert.equal('verificationStatus' in f.calls[0].changes, false)
  }
})

test('forbidden, unknown and mixed fields reject the whole write', async () => {
  for (const input of [
    { displayName: 'Forged' },
    { headline: 'Forged' },
    { contactEmail: 'forged@example.com' },
    { specialty: 'Forged' },
    { slug: 'forged' },
    { verificationStatus: 'verified' },
    { publicationStatus: 'published' },
    { profileId: 'other-profile' },
    { ownerAccountId: 'other-account' },
    { role: 'administrator' },
    { bio: 'Updated professional biography.', publicationStatus: 'published' },
    { city: 'Lagos', unknownField: true },
  ]) {
    const f = fixture()
    await assert.rejects(f.run(input), ProfessionalProfileEditError)
    assert.deepEqual(f.calls, [])
  }
})

test('invalid URLs, lengths and empty payloads reject without writing', async () => {
  for (const input of [
    {},
    null,
    { websiteUrl: 'http://example.com' },
    { websiteUrl: 'not-a-url' },
    { websiteUrl: `https://example.com/${'x'.repeat(2048)}` },
    { bio: 'too short' },
    { bio: 'x'.repeat(10001) },
    { city: 'x'.repeat(121) },
    { state: 'x'.repeat(121) },
    { country: 'x'.repeat(121) },
  ]) {
    const f = fixture()
    await assert.rejects(f.run(input), ProfessionalProfileEditError)
    assert.deepEqual(f.calls, [])
  }
})

test('locked account must still be verified, active, professional and approved', async () => {
  for (const locked of [
    null,
    { ...state, emailVerified: false },
    { ...state, role: 'client' as const },
    { ...state, approvalStatus: 'pending' as const },
    { ...state, approvalStatus: 'rejected' as const },
    { ...state, status: 'suspended' as const },
    { ...state, status: 'closed' as const },
    { ...state, hasAdministratorRecord: true },
    { ...state, authSubject: 'other-subject' },
    { ...state, id: 'other-account' },
  ]) {
    const f = fixture({ locked })
    await assert.rejects(
      f.run({ city: 'Lagos' }),
      MarketplaceAccountAccessError,
    )
    assert.deepEqual(f.calls, [])
  }
})

test('lost or mismatched ownership denies edit even after initial resolver approved', async () => {
  for (const locked of [
    { ...state, profileId: null },
    { ...state, profileId: 'other-profile' },
    { ...state, ownerAccountId: null },
    { ...state, ownerAccountId: 'other-account' },
  ]) {
    const f = fixture({ locked })
    await assert.rejects(
      f.run({ city: 'Lagos' }),
      (error) =>
        error instanceof ProfessionalProfileEditError ||
        error instanceof MarketplaceAccountAccessError,
    )
    assert.deepEqual(f.calls, [])
  }
})

test('failed update rolls back and hides storage details', async () => {
  const failed = fixture({ updateFailure: true })
  await assert.rejects(
    failed.run({ city: 'Lagos' }),
    (error) =>
      error instanceof MarketplaceAccountServiceError &&
      error.message === 'Marketplace account temporarily unavailable',
  )
  assert.equal(failed.rolledBack, true)
  assert.deepEqual(failed.calls, [])

  const missing = fixture({ updateSucceeded: false })
  await assert.rejects(
    missing.run({ city: 'Lagos' }),
    MarketplaceAccountAccessError,
  )
  assert.equal(missing.rolledBack, true)
})

test('disabled local gate denies without a write', async () => {
  for (const gate of [{}, { ...local, NODE_ENV: 'production' }]) {
    const f = fixture({ gate })
    await assert.rejects(
      f.run({ city: 'Lagos' }),
      MarketplaceAccountAccessError,
    )
    assert.deepEqual(f.calls, [])
  }
})

test('session resolver denial prevents the transaction entirely', async () => {
  let transactions = 0
  const update = createProfessionalProfileUpdateBoundary({
    async requireApproved() {
      throw new MarketplaceAccountAccessError(401)
    },
    async withLockedProfile() {
      transactions++
      throw new Error('should not be reached')
    },
  })
  await assert.rejects(
    update({ city: 'Lagos' }, local),
    MarketplaceAccountAccessError,
  )
  assert.equal(transactions, 0)
})
