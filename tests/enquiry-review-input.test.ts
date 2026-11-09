import assert from 'node:assert/strict'
import test from 'node:test'
import {
  enquiryNoteInput,
  enquiryStatusInput,
} from '../src/lib/enquiry-review-input'

test('manual enquiry review accepts only known statuses and bounded notes', () => {
  assert.equal(enquiryStatusInput.safeParse('in_progress').success, true)
  assert.equal(enquiryStatusInput.safeParse('approved').success, false)
  assert.equal(enquiryNoteInput.safeParse('Called client.').success, true)
  assert.equal(enquiryNoteInput.safeParse('   ').success, false)
  assert.equal(enquiryNoteInput.safeParse('x'.repeat(4001)).success, false)
})
