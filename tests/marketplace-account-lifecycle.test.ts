import assert from 'node:assert/strict'
import test from 'node:test'
import {
  assertProfessionalProfileClaimAllowed,
  beginProfessionalOnboarding,
  MarketplaceLifecycleError,
  transitionMarketplaceAccountStatus,
  transitionProfessionalApproval,
  type MarketplaceAccountStatus,
} from '../src/lib/marketplace-account-lifecycle'
import type { ProfessionalApprovalStatus } from '../src/lib/marketplace-account-authorization'

const admin = { kind: 'administrator' as const, adminId: 'admin-1' }
const owner = { kind: 'account-holder' as const, authSubject: 'user-1' }

function rejects(fn: () => unknown, code: MarketplaceLifecycleError['code']) {
  assert.throws(
    fn,
    (error) =>
      error instanceof MarketplaceLifecycleError && error.code === code,
  )
}

test('a verified active client can begin their own professional onboarding', () => {
  const input = {
    actor: owner,
    authSubject: 'user-1',
    role: 'client' as const,
    status: 'active' as const,
    emailVerified: true,
    hasProfessionalAccount: false,
  }
  assert.deepEqual(beginProfessionalOnboarding(input), {
    role: 'professional',
    approvalStatus: 'pending',
  })
  assert.equal(input.role, 'client')
})

test('onboarding denies another identity, administrators and ineligible accounts', () => {
  const eligible = {
    actor: owner,
    authSubject: 'user-1',
    role: 'client' as const,
    status: 'active' as MarketplaceAccountStatus,
    emailVerified: true,
    hasProfessionalAccount: false,
  }
  rejects(
    () => beginProfessionalOnboarding({ ...eligible, authSubject: 'user-2' }),
    'forbidden',
  )
  rejects(
    () => beginProfessionalOnboarding({ ...eligible, actor: admin }),
    'forbidden',
  )
  rejects(
    () => beginProfessionalOnboarding({ ...eligible, emailVerified: false }),
    'invalid_transition',
  )
  rejects(
    () => beginProfessionalOnboarding({ ...eligible, status: 'suspended' }),
    'invalid_transition',
  )
  rejects(
    () => beginProfessionalOnboarding({ ...eligible, status: 'closed' }),
    'invalid_transition',
  )
  rejects(
    () => beginProfessionalOnboarding({ ...eligible, role: 'professional' }),
    'invalid_transition',
  )
  rejects(
    () =>
      beginProfessionalOnboarding({
        ...eligible,
        hasProfessionalAccount: true,
      }),
    'invalid_transition',
  )
})

test('account status allows only administrator suspension, restoration and closure', () => {
  const states: MarketplaceAccountStatus[] = ['active', 'suspended', 'closed']
  const allowed = new Set([
    'active:suspended',
    'active:closed',
    'suspended:active',
    'suspended:closed',
  ])
  for (const current of states) {
    for (const next of states) {
      const input = { actor: admin, current, next, reason: 'Reviewed decision' }
      if (allowed.has(`${current}:${next}`)) {
        assert.equal(transitionMarketplaceAccountStatus(input), next)
      } else {
        rejects(
          () => transitionMarketplaceAccountStatus(input),
          'invalid_transition',
        )
      }
    }
  }
})

test('account holders and missing reasons cannot change account status', () => {
  const input = {
    actor: admin,
    current: 'active' as const,
    next: 'suspended' as const,
    reason: 'Reviewed decision',
  }
  rejects(
    () => transitionMarketplaceAccountStatus({ ...input, actor: owner }),
    'forbidden',
  )
  rejects(
    () =>
      transitionMarketplaceAccountStatus({
        ...input,
        actor: { kind: 'administrator', adminId: ' ' },
      }),
    'forbidden',
  )
  rejects(
    () => transitionMarketplaceAccountStatus({ ...input, reason: '  ' }),
    'missing_reason',
  )
})

test('approval permits only initial decisions and admin-reviewed resubmission', () => {
  const states: ProfessionalApprovalStatus[] = [
    'pending',
    'approved',
    'rejected',
  ]
  const allowed = new Set([
    'pending:approved',
    'pending:rejected',
    'rejected:pending',
  ])
  for (const current of states) {
    for (const next of states) {
      const input = { actor: admin, current, next, reason: 'Review recorded' }
      if (allowed.has(`${current}:${next}`)) {
        assert.equal(transitionProfessionalApproval(input), next)
      } else {
        rejects(
          () => transitionProfessionalApproval(input),
          'invalid_transition',
        )
      }
    }
  }
})

test('account holders and missing reasons cannot make approval decisions', () => {
  const input = {
    actor: admin,
    current: 'pending' as const,
    next: 'approved' as const,
    reason: 'Evidence reviewed',
  }
  rejects(
    () => transitionProfessionalApproval({ ...input, actor: owner }),
    'forbidden',
  )
  rejects(
    () => transitionProfessionalApproval({ ...input, reason: '\t' }),
    'missing_reason',
  )
})

test('profile claims require administrator approval and independent eligibility', () => {
  const eligible = {
    actor: admin,
    role: 'professional' as const,
    status: 'active' as const,
    approvalStatus: 'approved' as const,
    emailVerified: true,
    manualReviewApproved: true,
    reviewReason: 'Identity evidence reviewed',
    currentProfileId: null,
    targetProfileId: 'profile-1',
    targetOwnerAccountId: null,
    linkedApplicationProfileId: 'profile-1',
  }
  assert.doesNotThrow(() => assertProfessionalProfileClaimAllowed(eligible))
  rejects(
    () => assertProfessionalProfileClaimAllowed({ ...eligible, actor: owner }),
    'forbidden',
  )
  for (const change of [
    { role: 'client' as const },
    { status: 'suspended' as const },
    { status: 'closed' as const },
    { approvalStatus: 'pending' as const },
    { approvalStatus: 'rejected' as const },
    { emailVerified: false },
    { manualReviewApproved: false },
    { currentProfileId: 'profile-2' },
    { targetProfileId: ' ' },
    { targetOwnerAccountId: 'account-2' },
    { linkedApplicationProfileId: 'profile-2' },
  ]) {
    rejects(
      () => assertProfessionalProfileClaimAllowed({ ...eligible, ...change }),
      'invalid_transition',
    )
  }
  assert.doesNotThrow(() =>
    assertProfessionalProfileClaimAllowed({
      ...eligible,
      linkedApplicationProfileId: null,
    }),
  )
  rejects(
    () =>
      assertProfessionalProfileClaimAllowed({
        ...eligible,
        reviewReason: '  ',
      }),
    'missing_reason',
  )
})

test('approval and suspension decisions do not change listing or identity states', () => {
  const record = {
    emailVerified: false,
    accountStatus: 'active' as const,
    approvalStatus: 'pending' as const,
    publicationStatus: 'draft',
    verificationStatus: 'unverified',
  }
  assert.equal(
    transitionProfessionalApproval({
      actor: admin,
      current: record.approvalStatus,
      next: 'approved',
      reason: 'Review recorded',
    }),
    'approved',
  )
  assert.equal(
    transitionMarketplaceAccountStatus({
      actor: admin,
      current: record.accountStatus,
      next: 'suspended',
      reason: 'Review recorded',
    }),
    'suspended',
  )
  assert.deepEqual(record, {
    emailVerified: false,
    accountStatus: 'active',
    approvalStatus: 'pending',
    publicationStatus: 'draft',
    verificationStatus: 'unverified',
  })
})
