import assert from 'node:assert/strict'
import test from 'node:test'
import {
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
