import assert from 'node:assert/strict'
import test from 'node:test'
import {
  parseProfessionalApplicationForm,
  parseProfessionalApplicationReview,
} from '../src/lib/professional-application-input'

function form(overrides: Record<string, string> = {}) {
  const values = {
    applicantName: 'Ada Okafor',
    email: 'ada@example.com',
    phone: '',
    businessName: '',
    specialty: 'Architecture',
    city: 'Lagos',
    state: 'Lagos',
    portfolioUrl: '',
    message: 'I design residential buildings across Lagos.',
    ...overrides,
  }
  const data = new FormData()
  for (const [key, value] of Object.entries(values)) data.set(key, value)
  return data
}

test('professional application accepts relevant details without an account', () => {
  const result = parseProfessionalApplicationForm(form())
  assert.equal(result.success, true)
  if (result.success) {
    assert.equal(result.data.phone, null)
    assert.equal(result.data.portfolioUrl, null)
  }
})

test('professional application rejects bad contact and portfolio values', () => {
  assert.equal(
    parseProfessionalApplicationForm(form({ email: 'bad' })).success,
    false,
  )
  assert.equal(
    parseProfessionalApplicationForm(
      form({ portfolioUrl: 'http://example.com' }),
    ).success,
    false,
  )
  assert.equal(
    parseProfessionalApplicationForm(form({ message: 'short' })).success,
    false,
  )
})

test('manual review accepts only constrained statuses and note lengths', () => {
  const review = new FormData()
  review.set('status', 'under_review')
  review.set('reviewNotes', 'Requested portfolio details.')
  assert.equal(parseProfessionalApplicationReview(review).success, true)
  review.set('status', 'published')
  assert.equal(parseProfessionalApplicationReview(review).success, false)
  review.set('status', 'approved')
  review.set('reviewNotes', 'x'.repeat(4001))
  assert.equal(parseProfessionalApplicationReview(review).success, false)
})
