import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createProfessionalOnboardingBoundary,
  ProfessionalOnboardingError,
} from '../src/lib/professional-onboarding-boundary'

type State = {
  role: 'client' | 'professional'
  status: 'active' | 'suspended' | 'closed'
  professional: boolean
  events: number
}

function harness(
  options: {
    subject?: string | null
    accountSubject?: string
    sessionVerified?: boolean
    storedVerified?: boolean
    userExists?: boolean
    admin?: 'active' | 'inactive'
    missingAccount?: boolean
    role?: State['role']
    status?: State['status']
    professional?: boolean
    failAt?: 'lookup' | 'update' | 'insert' | 'event'
  } = {},
) {
  let state: State = {
    role: options.role ?? 'client',
    status: options.status ?? 'active',
    professional: options.professional ?? false,
    events: 0,
  }
  let queue = Promise.resolve()
  let locks = 0
  const start = createProfessionalOnboardingBoundary({
    getIdentity: async () =>
      options.subject === null
        ? null
        : {
            id: options.subject ?? 'auth-1',
            emailVerified: options.sessionVerified !== false,
          },
    withLockedIdentity: async (subject, operation) => {
      assert.equal(subject, options.subject ?? 'auth-1')
      const previous = queue
      let release!: () => void
      queue = new Promise<void>((resolve) => {
        release = resolve
      })
      await previous
      locks++
      const draft = { ...state }
      try {
        const result = await operation({
          exists: options.userExists !== false,
          emailVerified: options.storedVerified !== false,
          hasAdministratorRecord: async () => Boolean(options.admin),
          findAccount: async () => {
            if (options.failAt === 'lookup') throw new Error('private SQL')
            return options.missingAccount
              ? null
              : {
                  id: 'account-1',
                  authSubject: options.accountSubject ?? 'auth-1',
                  role: draft.role,
                  status: draft.status,
                  hasProfessionalAccount: draft.professional,
                }
          },
          changeRoleToProfessional: async () => {
            if (options.failAt === 'update') throw new Error('private SQL')
            if (draft.role !== 'client' || draft.status !== 'active')
              return false
            draft.role = 'professional'
            return true
          },
          createPendingProfessionalAccount: async () => {
            if (options.failAt === 'insert') throw new Error('private SQL')
            draft.professional = true
          },
          recordOnboardingStarted: async () => {
            if (options.failAt === 'event') throw new Error('private SQL')
            draft.events++
          },
        })
        state = draft // Simulated transaction commit; errors roll back.
        return result
      } finally {
        release()
      }
    },
  })
  return {
    start,
    get state() {
      return state
    },
    get locks() {
      return locks
    },
  }
}

async function denied(start: () => Promise<unknown>) {
  await assert.rejects(
    start(),
    (error) =>
      error instanceof ProfessionalOnboardingError &&
      error.message === 'Professional onboarding is unavailable',
  )
}

test('verified active client becomes a pending professional with one event', async () => {
  const h = harness()
  assert.equal(await h.start(), 'account-1')
  assert.deepEqual(h.state, {
    role: 'professional',
    status: 'active',
    professional: true,
    events: 1,
  })
  await denied(h.start)
  assert.equal(h.state.events, 1)
})

test('missing or unverified session cannot start onboarding', async () => {
  for (const options of [
    { subject: null },
    { subject: '' },
    { sessionVerified: false },
    { storedVerified: false },
  ]) {
    const h = harness(options)
    await denied(h.start)
    assert.equal(h.state.events, 0)
    if (options.subject === null || options.subject === '')
      assert.equal(h.locks, 0)
  }
})

test('active and inactive administrator identities are both denied', async () => {
  for (const admin of ['active', 'inactive'] as const) {
    const h = harness({ admin })
    await denied(h.start)
    assert.equal(h.state.role, 'client')
    assert.equal(h.state.events, 0)
  }
})

test('missing, mismatched, suspended, closed and inconsistent accounts are denied', async () => {
  for (const options of [
    { userExists: false },
    { missingAccount: true },
    { accountSubject: 'someone-else' },
    { status: 'suspended' as const },
    { status: 'closed' as const },
    { role: 'professional' as const },
    { professional: true },
  ]) {
    const h = harness(options)
    await denied(h.start)
    assert.equal(h.state.events, 0)
  }
})

test('concurrent attempts serialize and cannot create duplicate professional rows', async () => {
  const h = harness()
  const results = await Promise.allSettled([h.start(), h.start()])
  assert.equal(
    results.filter((result) => result.status === 'fulfilled').length,
    1,
  )
  assert.equal(
    results.filter((result) => result.status === 'rejected').length,
    1,
  )
  assert.equal(h.state.events, 1)
  assert.equal(h.locks, 2)
})

test('transaction failures roll back role, professional row and event', async () => {
  for (const failAt of ['lookup', 'update', 'insert', 'event'] as const) {
    const h = harness({ failAt })
    await denied(h.start)
    assert.deepEqual(h.state, {
      role: 'client',
      status: 'active',
      professional: false,
      events: 0,
    })
  }
})
