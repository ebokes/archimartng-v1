import assert from 'node:assert/strict'
import test from 'node:test'
import { readPasswordResetToken } from '../src/lib/password-reset-token'

test('accepts one Better Auth-shaped token', () => {
  assert.equal(
    readPasswordResetToken('?token=abcdefghijklmnopqrstuvwx'),
    'abcdefghijklmnopqrstuvwx',
  )
})

test('rejects missing, duplicate, malformed, and error callbacks', () => {
  for (const search of [
    '',
    '?token=short',
    '?token=abcdefghijklmnopqrstuvwx&token=abcdefghijklmnopqrstuvwx',
    '?token=abcdefghijklmnopqrstuvwx&error=INVALID_TOKEN',
    '?token=abc%2Fdefghijklmnopqrstuvwx',
  ])
    assert.equal(readPasswordResetToken(search), null)
})
