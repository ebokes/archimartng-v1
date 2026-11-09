import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { isPlanImageUploadConfigured } from '../src/lib/plan-image-storage'

const names = [
  'PLAN_IMAGE_ENV',
  'PLAN_IMAGE_DEV_ENDPOINT',
  'PLAN_IMAGE_DEV_BUCKET',
  'PLAN_IMAGE_DEV_PUBLIC_BASE_URL',
  'PLAN_IMAGE_DEV_REGION',
  'PLAN_IMAGE_DEV_ACCESS_KEY_ID',
  'PLAN_IMAGE_DEV_SECRET_ACCESS_KEY',
] as const
const original = Object.fromEntries(
  names.map((name) => [name, process.env[name]]),
)

after(() => {
  for (const name of names) {
    const value = original[name]
    if (value === undefined) delete process.env[name]
    else process.env[name] = value
  }
})

test('R2 upload stays disabled for missing or placeholder configuration', () => {
  for (const name of names) delete process.env[name]
  assert.equal(isPlanImageUploadConfigured(), false)

  process.env.PLAN_IMAGE_ENV = 'development'
  process.env.PLAN_IMAGE_DEV_ENDPOINT =
    'https://account.r2.cloudflarestorage.com'
  process.env.PLAN_IMAGE_DEV_BUCKET = 'archimart-development-images'
  process.env.PLAN_IMAGE_DEV_PUBLIC_BASE_URL =
    'https://development-images.example.com'
  process.env.PLAN_IMAGE_DEV_REGION = 'auto'
  process.env.PLAN_IMAGE_DEV_ACCESS_KEY_ID = 'replace-me'
  process.env.PLAN_IMAGE_DEV_SECRET_ACCESS_KEY = 'replace-me'
  assert.equal(isPlanImageUploadConfigured(), false)

  process.env.PLAN_IMAGE_DEV_ACCESS_KEY_ID = 'test-access-key'
  process.env.PLAN_IMAGE_DEV_SECRET_ACCESS_KEY = 'test-secret-key'
  assert.equal(isPlanImageUploadConfigured(), false)

  process.env.PLAN_IMAGE_DEV_PUBLIC_BASE_URL = 'https://dev-images.test'
  assert.equal(isPlanImageUploadConfigured(), true)
})
