import assert from 'node:assert/strict'
import test from 'node:test'
import { getPublicSiteUrl } from '../src/lib/site-url'

test('public site URL accepts a clean HTTPS origin', () => {
  assert.equal(
    getPublicSiteUrl('https://archimart.ng/'),
    'https://archimart.ng',
  )
})

test('public site URL rejects placeholders and local addresses', () => {
  for (const value of [
    undefined,
    '',
    'http://archimart.ng',
    'https://localhost',
    'https://127.0.0.1',
    'https://preview.example',
    'https://archimart.ng/path',
    'https://archimart.ng?preview=1',
    'https://user:password@archimart.ng',
  ]) {
    assert.equal(getPublicSiteUrl(value), null)
  }
})
