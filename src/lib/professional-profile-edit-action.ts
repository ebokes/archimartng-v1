import 'server-only'

import { MarketplaceAccountAccessError } from './marketplace-account-authorization'
import { ProfessionalProfileEditError } from './professional-profile-edit-policy'

export type ProfessionalProfileFormValues = {
  bio: string
  websiteUrl: string
  city: string
  state: string
  country: string
}

export type ProfessionalProfileEditActionState = {
  status: 'idle' | 'invalid' | 'saved' | 'denied' | 'unavailable' | 'error'
  values: ProfessionalProfileFormValues
  selectedFields: Array<'websiteUrl' | 'city' | 'state' | 'country'>
  attempt: number
}

const fields = ['bio', 'websiteUrl', 'city', 'state', 'country'] as const
const fieldSet: ReadonlySet<string> = new Set(fields)

export function createProfessionalProfileEditAction(dependencies: {
  enabled: () => boolean
  update: (changes: unknown) => Promise<void>
}) {
  return async function submitProfessionalProfileEdit(
    previous: ProfessionalProfileEditActionState,
    formData: FormData,
  ): Promise<ProfessionalProfileEditActionState> {
    const attempt = previous.attempt + 1
    if (!dependencies.enabled())
      return { ...previous, status: 'unavailable', attempt }

    // React adds this key for progressive useActionState submissions. It is
    // transport metadata, never a profile field. All other extra keys fail.
    const submittedKeys = [...formData.keys()].filter(
      (key) => key !== '$ACTION_KEY',
    )
    const validKeys =
      formData.getAll('bio').length === 1 &&
      submittedKeys.every(
        (key) => fieldSet.has(key) && formData.getAll(key).length === 1,
      )
    const selectedFields = fields.filter(
      (field): field is Exclude<typeof field, 'bio'> =>
        field !== 'bio' && formData.has(field),
    )

    // Return only known text fields to the form. Bound retained values so an
    // invalid request cannot create an arbitrarily large action response.
    function readValue(field: (typeof fields)[number]) {
      const value = formData.get(field)
      if (typeof value === 'string') return value.slice(0, 10001)
      const fallback = previous.values[field]
      return typeof fallback === 'string' ? fallback.slice(0, 10001) : ''
    }
    const values: ProfessionalProfileFormValues = {
      bio: readValue('bio'),
      websiteUrl: readValue('websiteUrl'),
      city: readValue('city'),
      state: readValue('state'),
      country: readValue('country'),
    }
    if (
      !validKeys ||
      fields.some(
        (field) =>
          formData.has(field) && typeof formData.get(field) !== 'string',
      )
    )
      return { status: 'invalid', values, selectedFields, attempt }

    try {
      const changes = Object.fromEntries(
        fields
          .filter((field) => formData.has(field))
          .map((field) => [field, values[field]]),
      )
      await dependencies.update(changes)
      return { status: 'saved', values, selectedFields: [], attempt }
    } catch (error) {
      if (error instanceof ProfessionalProfileEditError) {
        return {
          status: error.code === 'invalid_input' ? 'invalid' : 'denied',
          values,
          selectedFields,
          attempt,
        }
      }
      if (error instanceof MarketplaceAccountAccessError)
        return { status: 'denied', values, selectedFields, attempt }
      return { status: 'error', values, selectedFields, attempt }
    }
  }
}
