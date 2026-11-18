import assert from 'node:assert/strict'
import test from 'node:test'
import {
  authorizeApprovedProfessional,
  authorizeMarketplaceAccount,
  MarketplaceAccountAccessError,
} from '../src/lib/marketplace-account-authorization'

test('an anonymous request cannot look up a marketplace account', async () => {
  let queried = false
  await assert.rejects(
    authorizeMarketplaceAccount(undefined, 'client', async () => {
      queried = true
      return {
        authSubject: 'subject-1',
        role: 'client' as const,
        isActive: true,
      }
    }),
    (error) =>
      error instanceof MarketplaceAccountAccessError && error.status === 401,
  )
  assert.equal(queried, false)
})

test('a session without an active account cannot gain access', async () => {
  for (const account of [
    undefined,
    { authSubject: 'subject-1', role: 'client' as const, isActive: false },
  ]) {
    await assert.rejects(
      authorizeMarketplaceAccount('subject-1', 'client', async () => account),
      (error) =>
        error instanceof MarketplaceAccountAccessError && error.status === 403,
    )
  }
})

test('a client session cannot access professional operations', async () => {
  await assert.rejects(
    authorizeMarketplaceAccount('subject-1', 'professional', async () => ({
      authSubject: 'subject-1',
      role: 'client',
      isActive: true,
    })),
    (error) =>
      error instanceof MarketplaceAccountAccessError && error.status === 403,
  )
})

test('a resolver result for another identity is denied', async () => {
  await assert.rejects(
    authorizeMarketplaceAccount('subject-1', 'client', async () => ({
      authSubject: 'subject-2',
      role: 'client',
      isActive: true,
    })),
    (error) =>
      error instanceof MarketplaceAccountAccessError && error.status === 403,
  )
})

test('an active account can access only its own role', async () => {
  const professional = {
    authSubject: 'subject-2',
    role: 'professional' as const,
    isActive: true,
  }
  assert.equal(
    await authorizeMarketplaceAccount(
      'subject-2',
      'professional',
      async (id) => {
        assert.equal(id, 'subject-2')
        return professional
      },
    ),
    professional,
  )
})

test('professional onboarding access does not require approval', async () => {
  const pending = {
    authSubject: 'subject-2',
    role: 'professional' as const,
    isActive: true,
    approvalStatus: 'pending' as const,
  }
  assert.equal(
    await authorizeMarketplaceAccount(
      'subject-2',
      'professional',
      async () => pending,
    ),
    pending,
  )
})

test('approved professional operations reject every non-approved state', async () => {
  for (const approvalStatus of ['pending', 'rejected', 'suspended'] as const) {
    await assert.rejects(
      authorizeApprovedProfessional('subject-2', async () => ({
        authSubject: 'subject-2',
        role: 'professional',
        isActive: true,
        approvalStatus,
      })),
      (error) =>
        error instanceof MarketplaceAccountAccessError && error.status === 403,
    )
  }
})

test('approved professional operations reject clients and suspended accounts', async () => {
  for (const account of [
    { authSubject: 'subject-2', role: 'client' as const, isActive: true },
    {
      authSubject: 'subject-2',
      role: 'professional' as const,
      isActive: false,
      approvalStatus: 'approved' as const,
    },
  ]) {
    await assert.rejects(
      authorizeApprovedProfessional('subject-2', async () => account),
      (error) =>
        error instanceof MarketplaceAccountAccessError && error.status === 403,
    )
  }
})

test('an active approved professional can access approved operations', async () => {
  const approved = {
    authSubject: 'subject-2',
    role: 'professional' as const,
    isActive: true,
    approvalStatus: 'approved' as const,
  }
  assert.equal(
    await authorizeApprovedProfessional('subject-2', async () => approved),
    approved,
  )
})
