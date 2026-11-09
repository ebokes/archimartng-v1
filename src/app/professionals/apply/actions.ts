'use server'

import { db } from '@/db'
import { professionalApplications } from '@/db/schema'
import { parseProfessionalApplicationForm } from '@/lib/professional-application-input'

export type ApplicationActionState = {
  error: string | null
  submitted: boolean
}

export async function submitProfessionalApplication(
  _state: ApplicationActionState,
  formData: FormData,
): Promise<ApplicationActionState> {
  const result = parseProfessionalApplicationForm(formData)
  if (!result.success) {
    return {
      error: result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join(' '),
      submitted: false,
    }
  }
  // A hidden field catches simple automated form submissions.
  if (formData.get('companyWebsite')) return { error: null, submitted: true }
  try {
    await db.insert(professionalApplications).values(result.data)
  } catch {
    return {
      error: 'We could not submit your application. Please try again.',
      submitted: false,
    }
  }
  return { error: null, submitted: true }
}
