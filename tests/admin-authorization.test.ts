import assert from 'node:assert/strict'
import test from 'node:test'
import {
  AdminAccessError,
  authorizeAdmin,
} from '../src/lib/admin-authorization'

test('missing session denies access without querying admins', async () => {
  let queried = false
  await assert.rejects(
    authorizeAdmin(undefined, async () => {
      queried = true
      return { id: 'admin', isActive: true }
    }),
    (error) => error instanceof AdminAccessError && error.status === 401,
  )
  assert.equal(queried, false)
})

test('session without an active admin record is denied', async () => {
  await assert.rejects(
    authorizeAdmin('subject-1', async (subject) => {
      assert.equal(subject, 'subject-1')
      return undefined
    }),
    (error) => error instanceof AdminAccessError && error.status === 403,
  )
})

test('inactive administrator is denied despite a valid session', async () => {
  await assert.rejects(
    authorizeAdmin('subject-1', async () => ({
      id: 'admin-1',
      isActive: false,
    })),
    (error) => error instanceof AdminAccessError && error.status === 403,
  )
})

test('session with an active admin record is allowed', async () => {
  const admin = { id: 'admin-1', isActive: true }
  assert.equal(await authorizeAdmin('subject-1', async () => admin), admin)
})
