import assert from 'node:assert/strict'
import test from 'node:test'
import { AdminAccessError } from '../src/lib/admin-authorization'
import { MarketplaceAccountStatusError } from '../src/lib/marketplace-account-status-boundary'
import {
  accountStatusFormResult,
  createAccountStatusAdminInterface,
  isLocalAccountStatusManagementEnabled,
  submitAccountStatusChange,
  type AccountStatusDetail,
} from '../src/lib/marketplace-account-status-admin-interface'

const id = '11111111-1111-4111-8111-111111111111'
const detail: AccountStatusDetail = {
  id,
  name: 'Disposable client',
  email: 'disposable@example.test',
  role: 'client',
  status: 'active',
  approvalStatus: null,
  events: [
    {
      id: 'event-1',
      action: 'account_suspended',
      reason: 'Internal reason',
      createdAt: new Date(),
      actorName: 'Administrator',
    },
  ],
}

function fixture(
  options: { admin?: boolean; enabled?: boolean; failure?: boolean } = {},
) {
  const calls: string[] = []
  const changes: Array<{ accountId: string; action: string; reason: string }> =
    []
  const api = createAccountStatusAdminInterface({
    async requireAdministrator() {
      calls.push('admin')
      if (options.admin === false) throw new AdminAccessError(403)
    },
    enabled: () => options.enabled !== false,
    async list() {
      calls.push('list')
      return [detail]
    },
    async detail(accountId) {
      calls.push('detail')
      return accountId === id ? detail : null
    },
    async change(input) {
      calls.push('change')
      if (options.failure) throw new Error('private database connection detail')
      changes.push(input)
    },
  })
  return { api, calls, changes }
}

test('gate requires explicit local development opt-in and rejects Vercel', () => {
  assert.equal(
    isLocalAccountStatusManagementEnabled({ NODE_ENV: 'development' }),
    false,
  )
  assert.equal(
    isLocalAccountStatusManagementEnabled({
      NODE_ENV: 'development',
      MARKETPLACE_ACCOUNT_STATUS_MANAGEMENT_ENABLED: 'true',
    }),
    true,
  )
  assert.equal(
    isLocalAccountStatusManagementEnabled({
      NODE_ENV: 'production',
      MARKETPLACE_ACCOUNT_STATUS_MANAGEMENT_ENABLED: 'true',
    }),
    false,
  )
  assert.equal(
    isLocalAccountStatusManagementEnabled({
      NODE_ENV: 'development',
      VERCEL_ENV: 'preview',
      MARKETPLACE_ACCOUNT_STATUS_MANAGEMENT_ENABLED: 'true',
    }),
    false,
  )
})

test('every list, detail and write requires administrator and gate before data access', async () => {
  for (const options of [{ admin: false }, { enabled: false }]) {
    const f = fixture(options)
    await assert.rejects(f.api.list())
    await assert.rejects(f.api.detail(id))
    await assert.rejects(
      f.api.change({ accountId: id, action: 'suspend', reason: 'Reason' }),
    )
    assert.equal(f.calls.includes('list'), false)
    assert.equal(f.calls.includes('detail'), false)
    assert.equal(f.calls.includes('change'), false)
    assert.equal(f.calls.filter((x) => x === 'admin').length, 3)
  }
})

test('bounded adapter delegates list and restricted history after authorization', async () => {
  const f = fixture()
  assert.deepEqual(await f.api.list(), [detail])
  assert.deepEqual((await f.api.detail(id))?.events, detail.events)
  assert.equal(await f.api.detail('invalid'), null)
  assert.equal(f.calls.filter((x) => x === 'admin').length, 3)
  assert.equal(f.calls.filter((x) => x === 'detail').length, 1)
})

test('valid suspension and restoration delegate unchanged role and ownership', async () => {
  const f = fixture()
  await f.api.change({
    accountId: id,
    action: 'suspend',
    reason: 'Administrative reason',
  })
  await f.api.change({
    accountId: id,
    action: 'restore',
    reason: 'Administrative reason',
  })
  assert.deepEqual(
    f.changes.map((x) => x.action),
    ['suspend', 'restore'],
  )
  assert.equal(detail.role, 'client')
  assert.equal(detail.approvalStatus, null)
  assert.equal(f.calls.filter((x) => x === 'change').length, 2)
})

test('invalid inputs never reach transaction boundary', async () => {
  const f = fixture()
  for (const input of [
    { accountId: 'bad', action: 'suspend', reason: 'Reason' },
    { accountId: id, action: 'close', reason: 'Reason' },
    { accountId: id, action: 'restore', reason: '   ' },
  ])
    await assert.rejects(f.api.change(input), MarketplaceAccountStatusError)
  assert.deepEqual(f.changes, [])
})

test('strict form fields delegate once and reject extra fields', async () => {
  const f = fixture()
  const form = new FormData()
  form.set('action', 'suspend')
  form.set('reason', 'Reason')
  await submitAccountStatusChange(id, form, f.api.change)
  assert.equal(f.changes.length, 1)
  form.set('role', 'administrator')
  await assert.rejects(
    submitAccountStatusChange(id, form, f.api.change),
    MarketplaceAccountStatusError,
  )
  assert.equal(f.changes.length, 1)
})

test('adapter failure exposes no database details through action boundary', async () => {
  const f = fixture({ failure: true })
  const form = new FormData()
  form.set('action', 'suspend')
  form.set('reason', 'Reason')
  const result = await accountStatusFormResult(id, form, f.api.change)
  assert.equal(result.saved, false)
  assert.equal(result.error?.includes('private database'), false)
  assert.deepEqual(f.changes, [])
})
