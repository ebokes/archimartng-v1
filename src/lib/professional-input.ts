import { z } from 'zod'

const optionalText = (limit: number) =>
  z
    .string()
    .trim()
    .max(limit)
    .transform((value) => value || null)

export const professionalInput = z.object({
  displayName: z.string().trim().min(2).max(160),
  slug: z
    .string()
    .trim()
    .max(180)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Use lowercase letters, numbers and hyphens.',
    ),
  headline: optionalText(240),
  bio: z.string().trim().min(20).max(10000),
  specialty: z.string().trim().min(2).max(120),
  city: optionalText(120),
  state: optionalText(120),
  country: optionalText(120),
  contactEmail: z
    .union([z.literal(''), z.email()])
    .transform((value) => value || null),
  contactPhone: optionalText(40),
  websiteUrl: z
    .union([z.literal(''), z.url().startsWith('https://')])
    .transform((value) => value || null),
  publicationStatus: z.enum(['draft', 'published', 'archived']),
  verificationStatus: z.enum(['unverified', 'verified', 'rejected']),
})

export type ProfessionalInput = z.infer<typeof professionalInput>

export function parseProfessionalForm(formData: FormData) {
  return professionalInput.safeParse(
    Object.fromEntries(
      [
        'displayName',
        'slug',
        'headline',
        'bio',
        'specialty',
        'city',
        'state',
        'country',
        'contactEmail',
        'contactPhone',
        'websiteUrl',
        'publicationStatus',
        'verificationStatus',
      ].map((key) => [key, formData.get(key) ?? '']),
    ),
  )
}
