'use server'

import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { enquiries, plans, professionals } from '@/db/schema'
import { ENQUIRY_CONSENT_VERSION, parseEnquiryForm } from '@/lib/enquiry-input'

export type EnquiryActionState = {
  error: string | null
  submitted: boolean
  revision?: number
  values?: Record<string, string>
}

export async function submitEnquiry(
  targetType: 'plan' | 'professional',
  slug: string,
  _state: EnquiryActionState,
  formData: FormData,
): Promise<EnquiryActionState> {
  const values = Object.fromEntries(
    ['name', 'email', 'phone', 'message', 'consentAccepted'].map((name) => [
      name,
      String(formData.get(name) ?? '').slice(0, 4000),
    ]),
  )
  const retry = {
    submitted: false,
    values,
    revision: (_state.revision ?? 0) + 1,
  }
  if (targetType !== 'plan' && targetType !== 'professional')
    return { ...retry, error: 'Invalid enquiry target.' }
  const result = parseEnquiryForm(formData)
  if (!result.success)
    return {
      ...retry,
      error: result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join(' '),
    }

  // A hidden field catches simple automated submissions.
  if (formData.get('companyWebsite')) return { error: null, submitted: true }

  const [target] =
    targetType === 'plan'
      ? await db
          .select({ id: plans.id })
          .from(plans)
          .where(
            and(eq(plans.slug, slug), eq(plans.publicationStatus, 'published')),
          )
          .limit(1)
      : await db
          .select({ id: professionals.id })
          .from(professionals)
          .where(
            and(
              eq(professionals.slug, slug),
              eq(professionals.publicationStatus, 'published'),
            ),
          )
          .limit(1)
  if (!target)
    return {
      ...retry,
      error: 'This listing is no longer available for enquiries.',
    }

  try {
    await db.insert(enquiries).values({
      name: result.data.name,
      email: result.data.email,
      phone: result.data.phone,
      message: result.data.message,
      consentAccepted: true,
      consentVersion: ENQUIRY_CONSENT_VERSION,
      consentedAt: new Date(),
      ...(targetType === 'plan'
        ? { planId: target.id }
        : { professionalId: target.id }),
    })
  } catch {
    return {
      ...retry,
      error: 'We could not send your enquiry. Please try again.',
    }
  }
  return { error: null, submitted: true }
}
