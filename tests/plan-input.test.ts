import assert from 'node:assert/strict'
import test from 'node:test'
import { parsePlanForm } from '../src/lib/plan-input'

function form(overrides: Record<string, string> = {}) {
  const values = {
    title: 'Contemporary bungalow',
    slug: 'contemporary-bungalow',
    summary: '',
    description: 'A detailed plan for a comfortable family home.',
    propertyType: 'Bungalow',
    bedrooms: '3',
    bathrooms: '2',
    floors: '1',
    plotAreaSqm: '450.5',
    floorAreaSqm: '',
    coverUrl: 'https://example.com/cover.jpg',
    coverAlt: 'Front elevation of a bungalow',
    publicationStatus: 'published',
    ...overrides,
  }
  const data = new FormData()
  for (const [key, value] of Object.entries(values)) data.set(key, value)
  return data
}

test('publishing requires a described HTTPS cover image', () => {
  assert.equal(parsePlanForm(form({ coverUrl: '' })).success, false)
  assert.equal(parsePlanForm(form({ coverAlt: '' })).success, false)
  assert.equal(
    parsePlanForm(form({ coverUrl: 'http://example.com/a.jpg' })).success,
    false,
  )
})

test('drafts can omit the cover and optional dimensions', () => {
  const result = parsePlanForm(
    form({
      publicationStatus: 'draft',
      coverUrl: '',
      coverAlt: '',
      bedrooms: '',
      bathrooms: '',
      floors: '',
      plotAreaSqm: '',
    }),
  )
  assert.equal(result.success, true)
  if (result.success) {
    assert.equal(result.data.bedrooms, null)
    assert.equal(result.data.plotAreaSqm, null)
  }
})

test('invalid slugs and property dimensions are rejected', () => {
  assert.equal(parsePlanForm(form({ slug: 'Hidden/Plan' })).success, false)
  assert.equal(parsePlanForm(form({ floors: '0' })).success, false)
  assert.equal(parsePlanForm(form({ plotAreaSqm: '-1' })).success, false)
})
