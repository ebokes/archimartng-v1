import { z } from 'zod'

export const enquiryInput = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.email().max(320),
  phone: z
    .string()
    .trim()
    .max(40)
    .transform((value) => value || null),
  message: z.string().trim().min(20).max(4000),
  consentAccepted: z.literal('yes'),
})

export const ENQUIRY_CONSENT_VERSION = 'enquiry-v1'

export function parseEnquiryForm(formData: FormData) {
  return enquiryInput.safeParse(
    Object.fromEntries(
      ['name', 'email', 'phone', 'message', 'consentAccepted'].map((key) => [
        key,
        formData.get(key) ?? '',
      ]),
    ),
  )
}
