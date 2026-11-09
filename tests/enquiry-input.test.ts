import assert from 'node:assert/strict'
import test from 'node:test'
import { parseEnquiryForm } from '../src/lib/enquiry-input'

function form(values: Record<string, string>) {
  const data = new FormData()
  for (const [key, value] of Object.entries(values)) data.set(key, value)
  return data
}

test('enquiry accepts contact details and explicit consent', () => {
  const result = parseEnquiryForm(
    form({
      name: 'A Client',
      email: 'client@example.com',
      message: 'Please tell me more about this listing.',
      consentAccepted: 'yes',
    }),
  )
  assert.equal(result.success, true)
  if (result.success) assert.equal(result.data.phone, null)
})

test('enquiry rejects missing consent, invalid email, and short message', () => {
  const base = {
    name: 'A Client',
    email: 'client@example.com',
    message: 'Please tell me more about this listing.',
    consentAccepted: 'yes',
  }
  assert.equal(
    parseEnquiryForm(form({ ...base, consentAccepted: '' })).success,
    false,
  )
  assert.equal(parseEnquiryForm(form({ ...base, email: 'bad' })).success, false)
  assert.equal(
    parseEnquiryForm(form({ ...base, message: 'Too short' })).success,
    false,
  )
})
