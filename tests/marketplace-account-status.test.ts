import assert from 'node:assert/strict'
import test from 'node:test'
import { AdminAccessError } from '../src/lib/admin-authorization'
import {
  createMarketplaceAccountStatusBoundary,
  MarketplaceAccountStatusError,
} from '../src/lib/marketplace-account-status-boundary'
import { mayCreateSession } from '../src/lib/client-session-admission'

const accountId = '11111111-1111-4111-8111-111111111111'
const adminId = '22222222-2222-4222-8222-222222222222'

type State = {
  authSubject: string
  role: 'client' | 'professional'
  status: 'active' | 'suspended' | 'closed'
  hasAdministratorRecord: boolean
  hasProfessionalAccount: boolean
  approvalStatus: 'pending' | 'approved' | 'rejected' | null
  profileId: string | null
}

function fixture(
  overrides: Partial<State> = {},
  options: {
    adminFailure?: boolean
    missing?: boolean
    inactiveAdmin?: boolean
    updateFailure?: boolean
    eventFailure?: boolean
    revokeFailure?: boolean
  } = {},
) {
  let state: State = {
    authSubject: 'subject-1',
    role: 'client',
    status: 'active',
    hasAdministratorRecord: false,
    hasProfessionalAccount: false,
    approvalStatus: null,
    profileId: null,
    ...overrides,
  }
  const events: Array<{
    action: string
    adminId: string
    reason: string
    at: Date
  }> = []
  let sessionsRevoked = false
  let serial = Promise.resolve()
  let transactions = 0
  const change = createMarketplaceAccountStatusBoundary({
    async requireAdministrator() {
      if (options.adminFailure) throw new AdminAccessError(403)
      return { id: adminId }
    },
    async withLockedAccount(targetId, actingAdminId, operation) {
      assert.equal(targetId, accountId)
      assert.equal(actingAdminId, adminId)
      transactions++
      const prior = serial
      let release!: () => void
      serial = new Promise<void>((resolve) => {
        release = resolve
      })
      await prior
      let nextState = { ...state }
      const stagedEvents: typeof events = []
      let stagedRevocation = false
      try {
        const result = await operation(
          options.missing || options.inactiveAdmin
            ? null
            : {
                findState: async () => ({ ...nextState }),
                async changeStatus(current, next) {
                  if (options.updateFailure)
                    throw new Error('private SQL detail')
                  if (nextState.status !== current) return false
                  nextState = { ...nextState, status: next }
                  return true
                },
                async recordEvent(action, actorAdminId, reason, at) {
                  if (options.eventFailure)
                    throw new Error('private event detail')
                  stagedEvents.push({
                    action,
                    adminId: actorAdminId,
                    reason,
                    at,
                  })
                },
                async revokeSessions(subject) {
                  assert.equal(subject, nextState.authSubject)
                  if (options.revokeFailure)
                    throw new Error('private session detail')
                  stagedRevocation = true
                },
              },
        )
        state = nextState
        events.push(...stagedEvents)
        sessionsRevoked ||= stagedRevocation
        return result
      } finally {
        release()
      }
    },
  })
  return {
    change,
    events,
    get state() {
      return state
    },
    get sessionsRevoked() {
      return sessionsRevoked
    },
    get transactions() {
      return transactions
    },
  }
}

test('active clients and professionals suspend with attributed history and revoked sessions', async () => {
  for (const role of ['client', 'professional'] as const) {
    const f = fixture(
      role === 'client'
        ? {}
        : {
            role,
            hasProfessionalAccount: true,
            approvalStatus: 'approved',
            profileId: 'unchanged-profile',
          },
    )
    await f.change({
      accountId,
      action: 'suspend',
      reason: '  Reviewed safety issue  ',
    })
    assert.equal(f.state.status, 'suspended')
    assert.equal(f.state.role, role)
    assert.equal(f.state.approvalStatus, role === 'client' ? null : 'approved')
    assert.equal(
      f.state.profileId,
      role === 'client' ? null : 'unchanged-profile',
    )
    assert.equal(f.sessionsRevoked, true)
    assert.equal(f.events.length, 1)
    assert.deepEqual(
      [f.events[0].action, f.events[0].adminId, f.events[0].reason],
      ['account_suspended', adminId, 'Reviewed safety issue'],
    )
    assert.ok(f.events[0].at instanceof Date)
  }
})

test('restoration returns to active without approving rejected professionals or recreating sessions', async () => {
  const f = fixture({
    role: 'professional',
    status: 'suspended',
    hasProfessionalAccount: true,
    approvalStatus: 'rejected',
    profileId: null,
  })
  await f.change({ accountId, action: 'restore', reason: 'Review completed' })
  assert.equal(f.state.status, 'active')
  assert.equal(f.state.approvalStatus, 'rejected')
  assert.equal(f.sessionsRevoked, false)
  assert.equal(f.events[0].action, 'account_restored')
})

test('missing or inactive administrators deny before any transaction', async () => {
  const f = fixture({}, { adminFailure: true })
  await assert.rejects(
    f.change({ accountId, action: 'suspend', reason: 'Valid reason' }),
    AdminAccessError,
  )
  assert.equal(f.transactions, 0)
  const inactive = fixture({}, { inactiveAdmin: true })
  await assert.rejects(
    inactive.change({ accountId, action: 'suspend', reason: 'Valid reason' }),
    MarketplaceAccountStatusError,
  )
  assert.equal(inactive.state.status, 'active')
})

test('blank reasons, malformed targets and invalid actions deny without a transaction', async () => {
  const f = fixture()
  for (const input of [
    { accountId, action: 'suspend' as const, reason: '   ' },
    { accountId: 'bad-id', action: 'suspend' as const, reason: 'Valid reason' },
    { accountId, action: 'close' as 'suspend', reason: 'Valid reason' },
  ])
    await assert.rejects(f.change(input), MarketplaceAccountStatusError)
  assert.equal(f.transactions, 0)
})

test('duplicate, reversed and closed-account transitions reject without an event', async () => {
  for (const [status, action] of [
    ['active', 'restore'],
    ['suspended', 'suspend'],
    ['closed', 'suspend'],
    ['closed', 'restore'],
  ] as const) {
    const f = fixture({ status })
    await assert.rejects(
      f.change({ accountId, action, reason: 'Valid reason' }),
      MarketplaceAccountStatusError,
    )
    assert.equal(f.events.length, 0)
    assert.equal(f.state.status, status)
  }
})

test('missing, overlapping and inconsistent accounts reject', async () => {
  for (const [state, options] of [
    [{}, { missing: true }],
    [{ hasAdministratorRecord: true }, {}],
    [{ hasProfessionalAccount: true }, {}],
    [{ role: 'professional' as const }, {}],
    [{ role: 'professional' as const, hasProfessionalAccount: true }, {}],
  ] as const) {
    const f = fixture(state, options)
    await assert.rejects(
      f.change({ accountId, action: 'suspend', reason: 'Valid reason' }),
      MarketplaceAccountStatusError,
    )
    assert.equal(f.events.length, 0)
  }
})

test('concurrent decisions serialize; only the first matching transition commits', async () => {
  const f = fixture()
  const results = await Promise.allSettled([
    f.change({ accountId, action: 'suspend', reason: 'First decision' }),
    f.change({ accountId, action: 'suspend', reason: 'Second decision' }),
  ])
  assert.deepEqual(
    results.map((result) => result.status),
    ['fulfilled', 'rejected'],
  )
  assert.equal(f.state.status, 'suspended')
  assert.equal(f.events.length, 1)
  assert.equal(f.sessionsRevoked, true)
})

test('status, event and session deletion roll back together on failure', async () => {
  for (const options of [
    { updateFailure: true },
    { eventFailure: true },
    { revokeFailure: true },
  ]) {
    const f = fixture({}, options)
    await assert.rejects(
      f.change({ accountId, action: 'suspend', reason: 'Valid reason' }),
      (error) =>
        error instanceof MarketplaceAccountStatusError &&
        !error.message.includes('private'),
    )
    assert.equal(f.state.status, 'active')
    assert.equal(f.events.length, 0)
    assert.equal(f.sessionsRevoked, false)
  }
})

test('suspended client and professional identities cannot create marketplace sessions', () => {
  assert.equal(
    mayCreateSession(
      {
        emailVerified: true,
        administratorIsActive: null,
        marketplaceRole: 'client',
        marketplaceStatus: 'suspended',
        professionalApproval: null,
      },
      true,
      true,
    ),
    false,
  )
  assert.equal(
    mayCreateSession(
      {
        emailVerified: true,
        administratorIsActive: null,
        marketplaceRole: 'professional',
        marketplaceStatus: 'suspended',
        professionalApproval: 'approved',
      },
      true,
      true,
    ),
    false,
  )
})
