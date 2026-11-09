'use server'

import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { enquiries, plans, professionals } from '@/db/schema'
import { ENQUIRY_CONSENT_VERSION, parseEnquiryForm } from '@/lib/enquiry-input'

export type EnquiryActionState = { error: string | null; submitted: boolean }

export async function submitEnquiry(
  targetType: 'plan' | 'professional',
  slug: string,
  _state: EnquiryActionState,
  formData: FormData,
): Promise<EnquiryActionState> {
  if (targetType !== 'plan' && targetType !== 'professional')
    return { error: 'Invalid enquiry target.', submitted: false }
  const result = parseEnquiryForm(formData)
  if (!result.success)
    return {
      error: result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join(' '),
      submitted: false,
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
      error: 'This listing is no longer available for enquiries.',
      submitted: false,
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
      error: 'We could not send your enquiry. Please try again.',
      submitted: false,
    }
  }
  return { error: null, submitted: true }
}
