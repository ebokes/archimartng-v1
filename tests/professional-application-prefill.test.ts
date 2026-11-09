import assert from 'node:assert/strict'
import test from 'node:test'
import { prefillProfessionalFromApplication } from '../src/lib/professional-application-prefill'

test('approved application details prefill only appropriate profile fields', () => {
  const values = prefillProfessionalFromApplication({
    id: '8b561500-68ee-48a9-a4ce-c9f30334a919',
    applicantName: 'Ada Okafor',
    email: 'ada@example.com',
    phone: '+234000000000',
    specialty: 'Architecture',
    city: 'Lagos',
    state: 'Lagos',
    portfolioUrl: 'https://example.com/portfolio',
  })

  assert.deepEqual(values, {
    displayName: 'Ada Okafor',
    slug: 'ada-okafor',
    specialty: 'Architecture',
    city: 'Lagos',
    state: 'Lagos',
    country: 'Nigeria',
    contactEmail: 'ada@example.com',
    contactPhone: '+234000000000',
    websiteUrl: 'https://example.com/portfolio',
    publicationStatus: 'draft',
    verificationStatus: 'unverified',
  })
  assert.equal('bio' in values, false)
})
