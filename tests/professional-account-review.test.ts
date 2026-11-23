import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createProfessionalAccountReviewBoundary,
  ProfessionalAccountReviewError,
  type ReviewDecision,
} from '../src/lib/professional-account-review-boundary'

type State = {
  role: 'professional' | 'client'
  accountStatus: 'active' | 'suspended' | 'closed'
  approvalStatus: 'pending' | 'approved' | 'rejected'
  emailVerified: boolean
  hasAdministratorRecord: boolean
  profileId: string | null
  reviewedByAdminId: string | null
  reviewedAt: Date | null
}

const accountId = '11111111-1111-4111-8111-111111111111'
const adminId = '22222222-2222-4222-8222-222222222222'
const at = new Date('2026-11-23T12:00:00Z')

function harness(
  overrides: Partial<State> = {},
  options: {
    admin?: boolean
    missing?: boolean
    failUpdate?: boolean
    failEvent?: boolean
  } = {},
) {
  let state: State = {
    role: 'professional',
    accountStatus: 'active',
    approvalStatus: 'pending',
    emailVerified: true,
    hasAdministratorRecord: false,
    profileId: null,
    reviewedByAdminId: null,
    reviewedAt: null,
    ...overrides,
  }
  const events: Array<{
    type: string
    reason: string
    adminId: string
    at: Date
  }> = []
  let lock = Promise.resolve()
  let adminChecks = 0
  const review = createProfessionalAccountReviewBoundary({
    async requireAdministrator() {
      adminChecks++
      if (options.admin === false) throw new Error('unauthorized')
      return { id: adminId }
    },
    now: () => at,
    async withLockedAccount<T>(
      id: string,
      operation: (
        locked: {
          findState: () => Promise<State>
          updateDecision: (
            current: State['approvalStatus'],
            next: ReviewDecision,
            actor: string,
            timestamp: Date,
          ) => Promise<boolean>
          recordEvent: (
            type: 'approval_granted' | 'approval_rejected' | 'review_reopened',
            reason: string,
            actor: string,
            timestamp: Date,
          ) => Promise<void>
        } | null,
      ) => Promise<T>,
    ): Promise<T> {
      assert.equal(id, accountId)
      // Model PostgreSQL's FOR UPDATE serialization and transaction rollback.
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
          async updateDecision(current, next, actor, timestamp) {
            if (options.failUpdate || staged.approvalStatus !== current)
              return false
            staged.approvalStatus = next
            staged.reviewedByAdminId = actor
            staged.reviewedAt = timestamp
            return true
          },
          async recordEvent(type, reason, actor, timestamp) {
            if (options.failEvent) throw new Error('private database failure')
            stagedEvents.push({ type, reason, adminId: actor, at: timestamp })
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
  return { review, state: () => state, events, adminChecks: () => adminChecks }
}

const decision = (next: string, reason = 'Reviewed identity evidence') => ({
  accountId,
  decision: next,
  reason,
})

test('administrator approves a pending account with attribution and no profile grant', async () => {
  const h = harness()
  await h.review(decision('approved'))
  assert.equal(h.state().approvalStatus, 'approved')
  assert.equal(h.state().reviewedByAdminId, adminId)
  assert.deepEqual(h.state().reviewedAt, at)
  assert.equal(h.state().profileId, null)
  assert.deepEqual(h.events, [
    {
      type: 'approval_granted',
      reason: 'Reviewed identity evidence',
      adminId,
      at,
    },
  ])
})

test('administrator rejects, then reopens a rejected account with separate events', async () => {
  const h = harness()
  await h.review(decision('rejected', 'Evidence incomplete'))
  await h.review(decision('pending', 'Revised evidence received'))
  assert.equal(h.state().approvalStatus, 'pending')
  assert.deepEqual(
    h.events.map((event) => event.type),
    ['approval_rejected', 'review_reopened'],
  )
  assert.deepEqual(
    h.events.map((event) => event.reason),
    ['Evidence incomplete', 'Revised evidence received'],
  )
})

test('unauthorized review performs no account transaction', async () => {
  const h = harness({}, { admin: false })
  await assert.rejects(
    h.review(decision('approved')),
    ProfessionalAccountReviewError,
  )
  assert.equal(h.adminChecks(), 1)
  assert.equal(h.state().approvalStatus, 'pending')
  assert.equal(h.events.length, 0)
})

test('missing account, invalid decision and missing reason fail closed', async () => {
  const missing = harness({}, { missing: true })
  await assert.rejects(
    missing.review(decision('approved')),
    ProfessionalAccountReviewError,
  )
  const h = harness()
  await assert.rejects(
    h.review(decision('invalid')),
    ProfessionalAccountReviewError,
  )
  await assert.rejects(
    h.review(decision('approved', '  ')),
    ProfessionalAccountReviewError,
  )
  await assert.rejects(
    h.review(decision('approved', 'x'.repeat(2001))),
    ProfessionalAccountReviewError,
  )
  assert.equal(h.events.length, 0)
})

test('invalid and duplicate transitions cannot record events', async () => {
  const h = harness()
  await assert.rejects(
    h.review(decision('pending')),
    ProfessionalAccountReviewError,
  )
  await h.review(decision('approved'))
  await assert.rejects(
    h.review(decision('approved')),
    ProfessionalAccountReviewError,
  )
  await assert.rejects(
    h.review(decision('rejected')),
    ProfessionalAccountReviewError,
  )
  assert.equal(h.events.length, 1)
})

test('suspended, closed, unverified and inconsistent accounts are denied', async () => {
  for (const overrides of [
    { accountStatus: 'suspended' as const },
    { accountStatus: 'closed' as const },
    { emailVerified: false },
    { role: 'client' as const },
    { hasAdministratorRecord: true },
    { profileId: accountId },
  ]) {
    const h = harness(overrides)
    await assert.rejects(
      h.review(decision('approved')),
      ProfessionalAccountReviewError,
    )
    assert.equal(h.events.length, 0)
  }
})

test('concurrent decisions serialize; exactly one wins', async () => {
  const h = harness()
  const outcomes = await Promise.allSettled([
    h.review(decision('approved')),
    h.review(decision('rejected')),
  ])
  assert.equal(
    outcomes.filter((result) => result.status === 'fulfilled').length,
    1,
  )
  assert.equal(h.events.length, 1)
  assert.ok(['approved', 'rejected'].includes(h.state().approvalStatus))
})

test('failed update or event rolls back decision and keeps errors generic', async () => {
  for (const options of [{ failUpdate: true }, { failEvent: true }]) {
    const h = harness({}, options)
    await assert.rejects(h.review(decision('approved')), (error: unknown) => {
      assert.ok(error instanceof ProfessionalAccountReviewError)
      assert.equal(
        error.message,
        'Professional account review could not be saved',
      )
      return true
    })
    assert.equal(h.state().approvalStatus, 'pending')
    assert.equal(h.events.length, 0)
  }
})
