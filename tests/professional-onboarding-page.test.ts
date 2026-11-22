import assert from 'node:assert/strict'
import test from 'node:test'
import { MarketplaceAccountAccessError } from '../src/lib/marketplace-account-authorization'
import { createProfessionalOnboardingAction } from '../src/lib/professional-onboarding-action'
import { ProfessionalOnboardingError } from '../src/lib/professional-onboarding-boundary'
import {
  mayStartDisposableProfessionalOnboarding,
  mayViewDisposableProfessionalStatus,
} from '../src/lib/professional-onboarding-gate'
import {
  professionalOnboardingPageAccess,
  professionalStatusPageAccess,
} from '../src/lib/professional-onboarding-page-access'

const local = {
  NODE_ENV: 'development',
  ACCOUNT_RATE_LIMIT_ENABLED: 'true',
  MARKETPLACE_CLIENT_SESSION_ENABLED: 'true',
  MARKETPLACE_PROFESSIONAL_SESSION_ENABLED: 'true',
  MARKETPLACE_PROFESSIONAL_TEST_SUBJECT: 'disposable-subject',
}

test('local gate admits only the allowlisted disposable subject', () => {
  assert.equal(
    mayStartDisposableProfessionalOnboarding('disposable-subject', local),
    true,
  )
  assert.equal(
    mayStartDisposableProfessionalOnboarding('another-subject', local),
    false,
  )
  assert.equal(
    mayViewDisposableProfessionalStatus('disposable-subject', local),
    true,
  )
  for (const env of [
    {},
    { ...local, VERCEL_ENV: 'preview' },
    { ...local, NODE_ENV: 'production' },
    { ...local, ACCOUNT_RATE_LIMIT_ENABLED: 'false' },
    { ...local, MARKETPLACE_PROFESSIONAL_TEST_SUBJECT: '' },
  ]) {
    assert.equal(
      mayStartDisposableProfessionalOnboarding('disposable-subject', env),
      false,
    )
    assert.equal(
      mayViewDisposableProfessionalStatus('disposable-subject', env),
      false,
    )
  }
})

test('onboarding page requires the gate and a resolved matching client', async () => {
  let calls = 0
  const resolve = async () => {
    calls++
    return { authSubject: 'disposable-subject' }
  }
  assert.deepEqual(await professionalOnboardingPageAccess(resolve, {}), {
    status: 'denied',
  })
  assert.equal(calls, 0)
  assert.deepEqual(await professionalOnboardingPageAccess(resolve, local), {
    status: 'allowed',
    value: { authSubject: 'disposable-subject' },
  })
  assert.equal(calls, 1)
  assert.deepEqual(
    await professionalOnboardingPageAccess(
      async () => ({ authSubject: 'another-subject' }),
      local,
    ),
    { status: 'denied' },
  )
  for (const [code, expected] of [
    [401, 'sign-in'],
    [403, 'denied'],
  ] as const) {
    assert.deepEqual(
      await professionalOnboardingPageAccess(async () => {
        throw new MarketplaceAccountAccessError(code)
      }, local),
      { status: expected },
    )
  }
})

test('private status page displays only a resolved professional decision', async () => {
  let calls = 0
  assert.deepEqual(
    await professionalStatusPageAccess(async () => {
      calls++
      return { approvalStatus: 'pending' as const }
    }, {}),
    { status: 'denied' },
  )
  assert.equal(calls, 0)
  for (const approvalStatus of ['pending', 'rejected', 'approved'] as const) {
    assert.deepEqual(
      await professionalStatusPageAccess(
        async () => ({ approvalStatus }),
        local,
      ),
      { status: 'allowed', value: { approvalStatus } },
    )
  }
  assert.deepEqual(
    await professionalStatusPageAccess(async () => {
      throw new MarketplaceAccountAccessError(401)
    }, local),
    { status: 'sign-in' },
  )
  assert.deepEqual(
    await professionalStatusPageAccess(async () => {
      throw new ProfessionalOnboardingError()
    }, local),
    { status: 'denied' },
  )
})

test('onboarding action is inert when disabled and hides repeated or failed writes', async () => {
  let calls = 0
  let enabled = false
  const action = createProfessionalOnboardingAction({
    enabled: () => enabled,
    start: async () => {
      calls++
      if (calls > 1) throw new ProfessionalOnboardingError()
    },
  })
  assert.deepEqual(await action(), { status: 'unavailable' })
  assert.equal(calls, 0)
  enabled = true
  assert.deepEqual(await action(), { status: 'pending' })
  assert.deepEqual(await action(), { status: 'error' })
  assert.equal(calls, 2)
  const failed = createProfessionalOnboardingAction({
    enabled: () => true,
    start: async () => {
      throw new Error('private database detail')
    },
  })
  assert.deepEqual(await failed(), { status: 'error' })
})
