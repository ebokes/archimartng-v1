import assert from 'node:assert/strict'
import test from 'node:test'
import {
  MAX_PLAN_IMAGE_BYTES,
  validatePlanImageUpload,
} from '../src/lib/plan-image-upload'

test('detects image bytes rather than trusting the filename or MIME label', async () => {
  const jpeg = new File(
    [new Uint8Array([0xff, 0xd8, 0xff, 0x00])],
    'photo.txt',
    { type: 'text/plain' },
  )
  assert.deepEqual(await validatePlanImageUpload(jpeg), {
    contentType: 'image/jpeg',
    extension: 'jpg',
  })
  const fake = new File(['not an image'], 'photo.jpg', { type: 'image/jpeg' })
  await assert.rejects(
    validatePlanImageUpload(fake),
    /JPEG, PNG, WebP, or AVIF/,
  )
})

test('rejects empty and oversized uploads before reading their bytes', async () => {
  await assert.rejects(
    validatePlanImageUpload(new File([], 'empty.png')),
    /4 MB or less/,
  )
  const oversized = new File(
    [new Uint8Array(MAX_PLAN_IMAGE_BYTES + 1)],
    'large.jpg',
  )
  await assert.rejects(validatePlanImageUpload(oversized), /4 MB or less/)
})
