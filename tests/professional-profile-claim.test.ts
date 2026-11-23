import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createProfessionalProfileClaimBoundary,
  ProfessionalProfileClaimError,
  type ClaimState,
} from '../src/lib/professional-profile-claim-boundary'

const accountId = '11111111-1111-4111-8111-111111111111'
const profileId = '22222222-2222-4222-8222-222222222222'
const adminId = '33333333-3333-4333-8333-333333333333'
const at = new Date('2026-11-23T12:00:00Z')
const input = {
  accountId,
  profileId,
  evidenceSummary: 'Reviewed signed practice documents',
  reason: 'Ownership evidence is sufficient',
  evidenceReviewed: true,
}

function harness(
  overrides: Partial<ClaimState> = {},
  options: {
    admin?: 'missing' | 'inactive'
    missing?: boolean
    failUpdate?: boolean
    failEvent?: boolean
  } = {},
) {
  let state: ClaimState = {
    authSubject: 'trusted-auth-subject',
    role: 'professional',
    status: 'active',
    approvalStatus: 'approved',
    emailVerified: true,
    hasAdministratorRecord: false,
    currentProfileId: null,
    targetExists: true,
    targetOwnerAccountId: null,
    linkedApplicationStatus: null,
    linkedApplicationProfileId: null,
    ...overrides,
  }
  const events: Array<{
    profileId: string
    adminId: string
    reason: string
    at: Date
  }> = []
  let lock = Promise.resolve()
  let adminChecks = 0
  const claim = createProfessionalProfileClaimBoundary({
    now: () => at,
    async requireAdministrator() {
      adminChecks++
      if (options.admin === 'inactive') throw new Error('unauthorized')
      if (options.admin === 'missing') return { id: '' }
      return { id: adminId }
    },
    async withLockedClaim<T>(
      id: string,
      target: string,
      operation: (
        locked: {
          findState: () => Promise<ClaimState>
          linkProfile: (
            profile: string,
            admin: string,
            timestamp: Date,
          ) => Promise<boolean>
          recordEvent: (
            profile: string,
            admin: string,
            reason: string,
            timestamp: Date,
          ) => Promise<void>
        } | null,
      ) => Promise<T>,
    ): Promise<T> {
      assert.equal(id, accountId)
      assert.equal(target, profileId)
      const previous = lock
      let release!: () => void
      lock = new Promise<void>((resolve) => {
        release = resolve
      })
      await previous
      try {
        if (options.missing) return await operation(null)
        const staged = { ...state }
        const stagedEvents: typeof events = []
        const result = await operation({
          async findState() {
            return staged
          },
          async linkProfile(profile, admin, timestamp) {
            if (
              options.failUpdate ||
              staged.currentProfileId ||
              staged.targetOwnerAccountId
            )
              return false
            staged.currentProfileId = profile
            staged.targetOwnerAccountId = id
            assert.equal(admin, adminId)
            assert.equal(timestamp, at)
            return true
          },
          async recordEvent(profile, admin, reason, timestamp) {
            if (options.failEvent) throw new Error('private database failure')
            stagedEvents.push({
              profileId: profile,
              adminId: admin,
              reason,
              at: timestamp,
            })
          },
        })
        state = staged
        events.push(...stagedEvents)
        return result
      } finally {
        release()
      }
    },
  })
  return { claim, state: () => state, events, adminChecks: () => adminChecks }
}

test('authorized claim links only the approved account and writes attributed evidence event', async () => {
  const h = harness()
  await h.claim(input)
  assert.equal(h.state().currentProfileId, profileId)
  assert.equal(h.state().approvalStatus, 'approved')
  assert.equal(h.events.length, 1)
  assert.deepEqual(h.events[0], {
    profileId,
    adminId,
    reason:
      'Ownership evidence reviewed: Reviewed signed practice documents\nDecision reason: Ownership evidence is sufficient',
    at,
  })
})

for (const admin of ['missing', 'inactive'] as const) {
  test(`${admin} administrator fails before the transaction`, async () => {
    const h = harness({}, { admin })
    await assert.rejects(h.claim(input), ProfessionalProfileClaimError)
    assert.equal(h.adminChecks(), 1)
    assert.equal(h.state().currentProfileId, null)
  })
}

for (const [name, state] of [
  ['pending', { approvalStatus: 'pending' }],
  ['rejected', { approvalStatus: 'rejected' }],
  ['suspended', { status: 'suspended' }],
  ['closed', { status: 'closed' }],
  ['unverified', { emailVerified: false }],
  ['admin overlap', { hasAdministratorRecord: true }],
  ['client role', { role: 'client' }],
  ['owned profile', { targetOwnerAccountId: 'another-account' }],
  ['existing ownership', { currentProfileId: 'another-profile' }],
  ['missing profile', { targetExists: false }],
  ['unapproved linked application', { linkedApplicationStatus: 'submitted' }],
  [
    'linked application mismatch',
    {
      linkedApplicationStatus: 'approved',
      linkedApplicationProfileId: 'another-profile',
    },
  ],
] as const) {
  test(`claim rejects ${name}`, async () => {
    const h = harness(state as Partial<ClaimState>)
    await assert.rejects(h.claim(input), ProfessionalProfileClaimError)
    assert.equal(h.state().currentProfileId, state.currentProfileId ?? null)
    assert.equal(h.events.length, 0)
  })
}

test('matching approved linked application permits claim', async () => {
  const h = harness({
    linkedApplicationStatus: 'approved',
    linkedApplicationProfileId: profileId,
  })
  await h.claim(input)
  assert.equal(h.events.length, 1)
})

for (const invalid of [
  { evidenceSummary: '' },
  { reason: ' ' },
  { evidenceReviewed: false },
  { profileId: 'invalid' },
  { accountId: 'invalid' },
]) {
  test('claim rejects missing evidence, reason, review attestation or invalid identifiers', async () => {
    const h = harness()
    await assert.rejects(
      h.claim({ ...input, ...invalid }),
      ProfessionalProfileClaimError,
    )
    assert.equal(h.events.length, 0)
  })
}

test('duplicate and simultaneous claims serialize and record only one event', async () => {
  const h = harness()
  const results = await Promise.allSettled([h.claim(input), h.claim(input)])
  assert.equal(
    results.filter((result) => result.status === 'fulfilled').length,
    1,
  )
  assert.equal(h.events.length, 1)
  await assert.rejects(h.claim(input), ProfessionalProfileClaimError)
})

test('event failure rolls the association back and hides database details', async () => {
  const h = harness({}, { failEvent: true })
  await assert.rejects(
    h.claim(input),
    (error: unknown) =>
      error instanceof ProfessionalProfileClaimError &&
      !error.message.includes('database'),
  )
  assert.equal(h.state().currentProfileId, null)
  assert.equal(h.events.length, 0)
})

test('missing account and failed conditional update never write an event', async () => {
  for (const options of [{ missing: true }, { failUpdate: true }]) {
    const h = harness({}, options)
    await assert.rejects(h.claim(input), ProfessionalProfileClaimError)
    assert.equal(h.events.length, 0)
  }
})
