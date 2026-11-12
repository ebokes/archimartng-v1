'use server'

import { db } from '@/db'
import { professionalApplications } from '@/db/schema'
import { parseProfessionalApplicationForm } from '@/lib/professional-application-input'

export type ApplicationActionState = {
  error: string | null
  submitted: boolean
  revision?: number
  values?: Record<string, string>
}

export async function submitProfessionalApplication(
  _state: ApplicationActionState,
  formData: FormData,
): Promise<ApplicationActionState> {
  const values = Object.fromEntries(
    [
      'applicantName',
      'email',
      'phone',
      'businessName',
      'specialty',
      'portfolioUrl',
      'city',
      'state',
      'proposedBio',
      'message',
    ].map((name) => [name, String(formData.get(name) ?? '').slice(0, 10000)]),
  )
  const retry = {
    submitted: false,
    values,
    revision: (_state.revision ?? 0) + 1,
  }
  const result = parseProfessionalApplicationForm(formData)
  if (!result.success) {
    return {
      ...retry,
      error: result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join(' '),
    }
  }
  // A hidden field catches simple automated form submissions.
  if (formData.get('companyWebsite')) return { error: null, submitted: true }
  try {
    await db.insert(professionalApplications).values(result.data)
  } catch {
    return {
      ...retry,
      error: 'We could not submit your application. Please try again.',
    }
  }
  return { error: null, submitted: true }
}
