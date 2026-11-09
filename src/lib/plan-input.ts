import { z } from 'zod'

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null)

const optionalInteger = z
  .union([z.literal(''), z.coerce.number().int().min(0).max(100)])
  .transform((value) => (value === '' ? null : value))
const optionalArea = z
  .union([z.literal(''), z.coerce.number().positive().max(9999999999.99)])
  .transform((value) => (value === '' ? null : value.toFixed(2)))

export const planInput = z
  .object({
    title: z.string().trim().min(3).max(160),
    slug: z
      .string()
      .trim()
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Use lowercase letters, numbers and hyphens.',
      )
      .max(180),
    summary: optionalText(500),
    description: z.string().trim().min(20).max(10000),
    propertyType: z.string().trim().min(2).max(80),
    bedrooms: optionalInteger,
    bathrooms: optionalInteger,
    floors: z
      .union([z.literal(''), z.coerce.number().int().min(1).max(100)])
      .transform((value) => (value === '' ? null : value)),
    plotAreaSqm: optionalArea,
    floorAreaSqm: optionalArea,
    coverUrl: z.union([
      z.literal(''),
      z.url().startsWith('https://'),
      z
        .string()
        .regex(
          /^\/plan-images\/[a-z0-9][a-z0-9._-]*\.(?:avif|jpe?g|png|webp)$/i,
        ),
    ]),
    coverAlt: z.string().trim().max(200),
    coverFileProvided: z.boolean().default(false),
    publicationStatus: z.enum(['draft', 'published', 'archived']),
  })
  .superRefine((value, context) => {
    if ((value.coverUrl || value.coverFileProvided) && !value.coverAlt)
      context.addIssue({
        code: 'custom',
        path: ['coverAlt'],
        message: 'Describe the cover image.',
      })
    if (
      value.publicationStatus === 'published' &&
      !value.coverUrl &&
      !value.coverFileProvided
    )
      context.addIssue({
        code: 'custom',
        path: ['coverUrl'],
        message: 'A cover image is required to publish.',
      })
  })

export type PlanInput = z.infer<typeof planInput>

export function parsePlanForm(formData: FormData) {
  const coverFile = formData.get('coverFile')
  return planInput.safeParse({
    ...Object.fromEntries(
      [
        'title',
        'slug',
        'summary',
        'description',
        'propertyType',
        'bedrooms',
        'bathrooms',
        'floors',
        'plotAreaSqm',
        'floorAreaSqm',
        'coverUrl',
        'coverAlt',
        'publicationStatus',
      ].map((key) => [key, formData.get(key) ?? '']),
    ),
    coverFileProvided: coverFile instanceof File && coverFile.size > 0,
  })
}
