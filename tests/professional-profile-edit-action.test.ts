import assert from 'node:assert/strict'
import test from 'node:test'
import { MarketplaceAccountAccessError } from '../src/lib/marketplace-account-authorization'
import {
  createProfessionalProfileEditAction,
  type ProfessionalProfileEditActionState,
} from '../src/lib/professional-profile-edit-action'
import { ProfessionalProfileEditError } from '../src/lib/professional-profile-edit-policy'

const initial: ProfessionalProfileEditActionState = {
  status: 'idle',
  attempt: 0,
  values: {
    bio: 'Existing professional biography.',
    websiteUrl: '',
    city: '',
    state: '',
    country: 'Nigeria',
  },
}

function form(changes: Record<string, string> = {}) {
  const data = new FormData()
  for (const [key, value] of Object.entries({ ...initial.values, ...changes }))
    data.append(key, value)
  return data
}

test('allowed fields delegate to the trusted update operation without identity fields', async () => {
  for (const field of [
    'bio',
    'websiteUrl',
    'city',
    'state',
    'country',
  ] as const) {
    const seen: unknown[] = []
    const action = createProfessionalProfileEditAction({
      enabled: () => true,
      update: async (changes) => {
        seen.push(changes)
      },
    })
    const value =
      field === 'bio'
        ? 'New professional biography for the profile.'
        : field === 'websiteUrl'
          ? 'https://example.com'
          : 'Lagos'
    const result = await action(initial, form({ [field]: value }))
    assert.equal(result.status, 'saved')
    assert.equal(result.values[field], value)
    assert.deepEqual(seen, [{ ...initial.values, [field]: value }])
    assert.equal('profileId' in (seen[0] as object), false)
  }
})

test('forbidden, unknown, duplicate and file fields reject before update', async () => {
  let updates = 0
  const action = createProfessionalProfileEditAction({
    enabled: () => true,
    update: async () => {
      updates++
    },
  })
  for (const key of [
    'profileId',
    'role',
    'approvalStatus',
    'ownerAccountId',
    'publicationStatus',
    'verificationStatus',
    'slug',
    'displayName',
    'unknownField',
    '$ACTION_FAKE',
  ]) {
    const data = form({ city: 'Lagos' })
    data.append(key, 'forged')
    const result = await action(initial, data)
    assert.equal(result.status, 'invalid', key)
    assert.equal(result.values.city, 'Lagos')
  }
  const duplicate = form()
  duplicate.append('bio', 'second biography')
  assert.equal((await action(initial, duplicate)).status, 'invalid')
  const upload = form()
  upload.set('city', new Blob(['bytes']))
  assert.equal((await action(initial, upload)).status, 'invalid')
  assert.equal(updates, 0)
})

test('React action-state transport key is ignored but never passed to the profile operation', async () => {
  let seen: unknown
  const action = createProfessionalProfileEditAction({
    enabled: () => true,
    update: async (changes) => {
      seen = changes
    },
  })
  const data = form()
  data.append('$ACTION_KEY', 'transport')
  assert.equal((await action(initial, data)).status, 'saved')
  assert.deepEqual(seen, initial.values)
})

test('forged prior action state cannot supply role or ownership fields', async () => {
  let seen: unknown
  const action = createProfessionalProfileEditAction({
    enabled: () => true,
    update: async (changes) => {
      seen = changes
    },
  })
  const forged = {
    ...initial,
    values: {
      ...initial.values,
      role: 'administrator',
      profileId: 'other-profile',
    },
  }
  assert.equal((await action(forged, form())).status, 'saved')
  assert.deepEqual(seen, initial.values)
})

test('validation errors preserve bounded user input for correction', async () => {
  const action = createProfessionalProfileEditAction({
    enabled: () => true,
    update: async () => {
      throw new ProfessionalProfileEditError('invalid_input')
    },
  })
  const result = await action(
    initial,
    form({ bio: 'Too short', city: ' Lagos ' }),
  )
  assert.equal(result.status, 'invalid')
  assert.equal(result.values.bio, 'Too short')
  assert.equal(result.values.city, ' Lagos ')
  assert.equal(result.attempt, 1)
  const tooLarge = form({ bio: 'x'.repeat(20000) })
  const bounded = await action(initial, tooLarge)
  assert.equal(bounded.values.bio.length, 10001)
})

test('disabled gate prevents delegation, including direct action calls', async () => {
  let calls = 0
  const action = createProfessionalProfileEditAction({
    enabled: () => false,
    update: async () => {
      calls++
    },
  })
  assert.deepEqual(await action(initial, form()), {
    ...initial,
    status: 'unavailable',
    attempt: 1,
  })
  assert.equal(calls, 0)
})

test('missing ownership and denied session return a generic denial', async () => {
  for (const failure of [
    new MarketplaceAccountAccessError(401),
    new MarketplaceAccountAccessError(403),
    new ProfessionalProfileEditError('forbidden'),
  ]) {
    const action = createProfessionalProfileEditAction({
      enabled: () => true,
      update: async () => {
        throw failure
      },
    })
    const result = await action(initial, form({ city: 'Lagos' }))
    assert.equal(result.status, 'denied')
    assert.equal(result.values.city, 'Lagos')
  }
})

test('storage failures return a generic error without private details', async () => {
  const action = createProfessionalProfileEditAction({
    enabled: () => true,
    update: async () => {
      throw new Error('private connection detail')
    },
  })
  const result = await action(initial, form())
  assert.equal(result.status, 'error')
  assert.equal(
    JSON.stringify(result).includes('private connection detail'),
    false,
  )
})
