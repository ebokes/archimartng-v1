import assert from 'node:assert/strict'
import test from 'node:test'
import {
  authorizeApprovedProfessional,
  authorizeClientAccount,
  authorizeProfessionalOnboarding,
  authorizeProfessionalStatus,
  MarketplaceAccountAccessError,
  type MarketplaceAccountRecord,
  type MarketplaceIdentity,
} from '../src/lib/marketplace-account-authorization'

const identity = { id: 'subject-1', emailVerified: true }
const client = {
  authSubject: 'subject-1',
  role: 'client' as const,
  status: 'active' as const,
  approvalStatus: null,
}
const pending = {
  ...client,
  role: 'professional' as const,
  approvalStatus: 'pending' as const,
}
const rejected = { ...pending, approvalStatus: 'rejected' as const }
const approved = { ...pending, approvalStatus: 'approved' as const }

const accessors = {
  client: authorizeClientAccount,
  onboarding: authorizeProfessionalOnboarding,
  approved: authorizeApprovedProfessional,
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

test('missing identity and unverified email fail before account lookup', async () => {
  for (const authorize of Object.values(accessors)) {
    let lookups = 0
    const findAccount = async () => {
      lookups += 1
      return approved
    }
    await expectDenied(() => authorize(undefined, findAccount), 401)
    await expectDenied(() => authorize(null, findAccount), 401)
    await expectDenied(
      () => authorize({ id: '', emailVerified: true }, findAccount),
      401,
    )
    await expectDenied(
      () => authorize({ id: identity.id, emailVerified: false }, findAccount),
      403,
    )
    assert.equal(lookups, 0)
  }
})

test('missing and mismatched account rows return generic denial', async () => {
  for (const authorize of Object.values(accessors)) {
    await expectDenied(() => authorize(identity, async () => undefined), 403)
    await expectDenied(
      () =>
        authorize(identity, async () => ({
          ...approved,
          authSubject: 'someone-else',
        })),
      403,
    )
  }
})

test('each active account state grants only its intended access', async () => {
  const cases: {
    record: MarketplaceAccountRecord
    permitted: keyof typeof accessors | null
  }[] = [
    { record: client, permitted: 'client' },
    { record: pending, permitted: 'onboarding' },
    { record: rejected, permitted: 'onboarding' },
    { record: approved, permitted: 'approved' },
    { record: { ...client, approvalStatus: 'pending' }, permitted: null },
    { record: { ...client, approvalStatus: 'approved' }, permitted: null },
    { record: { ...client, approvalStatus: 'rejected' }, permitted: null },
    { record: { ...pending, approvalStatus: null }, permitted: null },
  ]

  for (const { record, permitted } of cases) {
    for (const [access, authorize] of Object.entries(accessors)) {
      const findAccount = async (subject: string) => {
        assert.equal(subject, identity.id)
        return record
      }
      if (access === permitted) {
        assert.equal(await authorize(identity, findAccount), record)
      } else {
        await expectDenied(() => authorize(identity, findAccount), 403)
      }
    }
  }
})

test('professional status access reads each approval state without granting approved operations', async () => {
  for (const record of [pending, rejected, approved])
    assert.equal(
      await authorizeProfessionalStatus(identity, async () => record),
      record,
    )
  await expectDenied(
    () => authorizeProfessionalStatus(identity, async () => client),
    403,
  )
  await expectDenied(
    () => authorizeApprovedProfessional(identity, async () => pending),
    403,
  )
})

test('suspended and closed accounts are denied at every access level', async () => {
  for (const account of [client, pending, rejected, approved]) {
    for (const status of ['suspended', 'closed'] as const) {
      for (const authorize of Object.values(accessors)) {
        await expectDenied(
          () => authorize(identity, async () => ({ ...account, status })),
          403,
        )
      }
    }
  }
})

test('untrusted identity extras cannot override the resolved role or approval', async () => {
  const forged = {
    ...identity,
    role: 'professional',
    approvalStatus: 'approved',
    status: 'active',
  }
  await expectDenied(
    () => authorizeApprovedProfessional(forged, async () => client),
    403,
  )
  await expectDenied(
    () => authorizeApprovedProfessional(forged, async () => pending),
    403,
  )
  await expectDenied(
    () => authorizeClientAccount(forged, async () => approved),
    403,
  )
})

test('approval and status cannot be inferred from an unrelated public listing', async () => {
  const record = {
    ...pending,
    publicationStatus: 'published',
    verificationStatus: 'verified',
  }
  await expectDenied(
    () => authorizeApprovedProfessional(identity, async () => record),
    403,
  )
  assert.equal(
    await authorizeProfessionalOnboarding(identity, async () => record),
    record,
  )
})

test('a verified identity is necessary even for an approved active account', async () => {
  const unverified: MarketplaceIdentity = {
    id: identity.id,
    emailVerified: false,
  }
  await expectDenied(
    () => authorizeApprovedProfessional(unverified, async () => approved),
    403,
  )
})
