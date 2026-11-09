import assert from 'node:assert/strict'
import test from 'node:test'
import { parseProfessionalForm } from '../src/lib/professional-input'

function form(overrides: Record<string, string> = {}) {
  const values = {
    displayName: 'Ada Okafor',
    slug: 'ada-okafor',
    headline: '',
    bio: 'Architect focused on thoughtful residential buildings.',
    specialty: 'Residential architecture',
    city: 'Lagos',
    state: 'Lagos',
    country: 'Nigeria',
    contactEmail: '',
    contactPhone: '',
    websiteUrl: '',
    publicationStatus: 'draft',
    verificationStatus: 'unverified',
    ...overrides,
  }
  const data = new FormData()
  for (const [key, value] of Object.entries(values)) data.set(key, value)
  return data
}

test('draft professional input keeps verification separate from publication', () => {
  const result = parseProfessionalForm(form({ publicationStatus: 'published' }))
  assert.equal(result.success, true)
  if (result.success) {
    assert.equal(result.data.publicationStatus, 'published')
    assert.equal(result.data.verificationStatus, 'unverified')
    assert.equal(result.data.contactEmail, null)
  }
})

test('professional input rejects invalid slugs, links and statuses', () => {
  assert.equal(
    parseProfessionalForm(form({ slug: '../hidden' })).success,
    false,
  )
  assert.equal(
    parseProfessionalForm(form({ websiteUrl: 'http://example.com' })).success,
    false,
  )
  assert.equal(
    parseProfessionalForm(form({ verificationStatus: 'self_verified' }))
      .success,
    false,
  )
  assert.equal(
    parseProfessionalForm(form({ contactEmail: 'not-an-email' })).success,
    false,
  )
})
