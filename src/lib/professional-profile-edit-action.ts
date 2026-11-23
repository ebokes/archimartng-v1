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
      submittedKeys.length === fields.length &&
      submittedKeys.every((key) => fieldSet.has(key)) &&
      fields.every((field) => formData.getAll(field).length === 1)

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
      fields.some((field) => typeof formData.get(field) !== 'string')
    )
      return { status: 'invalid', values, attempt }

    try {
      await dependencies.update(values)
      return { status: 'saved', values, attempt }
    } catch (error) {
      if (error instanceof ProfessionalProfileEditError) {
        return {
          status: error.code === 'invalid_input' ? 'invalid' : 'denied',
          values,
          attempt,
        }
      }
      if (error instanceof MarketplaceAccountAccessError)
        return { status: 'denied', values, attempt }
      return { status: 'error', values, attempt }
    }
  }
}
