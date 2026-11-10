import { z } from 'zod'

const optionalText = (limit: number) =>
  z
    .string()
    .trim()
    .max(limit)
    .transform((value) => value || null)

export const professionalApplicationInput = z.object({
  applicantName: z.string().trim().min(2).max(160),
  email: z.email().max(320),
  phone: optionalText(40),
  businessName: optionalText(160),
  specialty: z.string().trim().min(2).max(120),
  city: optionalText(120),
  state: optionalText(120),
  portfolioUrl: z
    .union([z.literal(''), z.url().startsWith('https://').max(2048)])
    .transform((value) => value || null),
  message: z.string().trim().min(20).max(4000),
  proposedBio: z.string().trim().min(20).max(10000),
})

export function parseProfessionalApplicationForm(formData: FormData) {
  return professionalApplicationInput.safeParse(
    Object.fromEntries(
      [
        'applicantName',
        'email',
        'phone',
        'businessName',
        'specialty',
        'city',
        'state',
        'portfolioUrl',
        'message',
        'proposedBio',
      ].map((key) => [key, formData.get(key) ?? '']),
    ),
  )
}

export const professionalApplicationReviewInput = z.object({
  status: z.enum(['submitted', 'under_review', 'approved', 'rejected']),
  reviewNotes: optionalText(4000),
})

export function parseProfessionalApplicationReview(formData: FormData) {
  return professionalApplicationReviewInput.safeParse({
    status: formData.get('status') ?? '',
    reviewNotes: formData.get('reviewNotes') ?? '',
  })
}
