'use server'

import { and, eq, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { authDb } from '@/db/auth-client'
import { professionalApplications, professionals } from '@/db/schema'
import {
  parseProfessionalForm,
  type ProfessionalInput,
} from '@/lib/professional-input'
import { requireAdmin } from '@/lib/require-admin'

export type ProfessionalActionState = { error: string | null }

function parse(
  formData: FormData,
): ProfessionalInput | ProfessionalActionState {
  const result = parseProfessionalForm(formData)
  if (result.success) return result.data
  return {
    error: result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join(' '),
  }
}

function isError(
  value: ProfessionalInput | ProfessionalActionState,
): value is ProfessionalActionState {
  return 'error' in value
}

function writeError(error: unknown): ProfessionalActionState {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505'
  )
    return { error: 'This slug is already in use.' }
  throw error
}

function values(input: ProfessionalInput) {
  return {
    displayName: input.displayName,
    slug: input.slug,
    headline: input.headline,
    bio: input.bio,
    specialty: input.specialty,
    city: input.city,
    state: input.state,
    country: input.country,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    websiteUrl: input.websiteUrl,
    publicationStatus: input.publicationStatus,
    verificationStatus: input.verificationStatus,
  }
}

function revalidateListings(slug: string, previousSlug?: string) {
  revalidatePath('/admin')
  revalidatePath('/admin/professionals')
  revalidatePath('/professionals')
  revalidatePath(`/professionals/${slug}`)
  if (previousSlug && previousSlug !== slug)
    revalidatePath(`/professionals/${previousSlug}`)
}

export async function createProfessional(
  _state: ProfessionalActionState,
  formData: FormData,
): Promise<ProfessionalActionState> {
  const admin = await requireAdmin()
  const input = parse(formData)
  if (isError(input)) return input
  try {
    await authDb.insert(professionals).values({
      ...values(input),
      createdByAdminId: admin.id,
      publishedAt: input.publicationStatus === 'published' ? new Date() : null,
      verifiedAt: input.verificationStatus === 'verified' ? new Date() : null,
      verifiedByAdminId:
        input.verificationStatus === 'verified' ? admin.id : null,
    })
  } catch (error) {
    return writeError(error)
  }
  revalidateListings(input.slug)
  redirect('/admin/professionals')
}

export async function createProfessionalFromApplication(
  applicationId: string,
  _state: ProfessionalActionState,
  formData: FormData,
): Promise<ProfessionalActionState> {
  const admin = await requireAdmin()
  if (!/^[0-9a-f-]{36}$/i.test(applicationId))
    return { error: 'Invalid application.' }
  const input = parse(formData)
  if (isError(input)) return input
  if (
    input.publicationStatus !== 'draft' ||
    input.verificationStatus !== 'unverified'
  )
    return {
      error: 'Create the profile as a draft before publishing or verifying it.',
    }

  let profileId: string | null = null
  try {
    profileId = await authDb.transaction(async (tx) => {
      const [application] = await tx
        .select({
          status: professionalApplications.status,
          professionalId: professionalApplications.professionalId,
        })
        .from(professionalApplications)
        .where(eq(professionalApplications.id, applicationId))
        .limit(1)
      if (application?.status !== 'approved' || application.professionalId)
        return null

      const [profile] = await tx
        .insert(professionals)
        .values({
          ...values(input),
          publicationStatus: 'draft',
          verificationStatus: 'unverified',
          createdByAdminId: admin.id,
        })
        .returning({ id: professionals.id })

      const [linked] = await tx
        .update(professionalApplications)
        .set({ professionalId: profile.id })
        .where(
          and(
            eq(professionalApplications.id, applicationId),
            eq(professionalApplications.status, 'approved'),
            isNull(professionalApplications.professionalId),
          ),
        )
        .returning({ id: professionalApplications.id })
      if (!linked) throw new ApplicationAlreadyLinkedError()
      return profile.id
    })
  } catch (error) {
    if (error instanceof ApplicationAlreadyLinkedError)
      return {
        error:
          'This application already has a profile or is no longer approved.',
      }
    return writeError(error)
  }
  if (!profileId)
    return {
      error: 'This application already has a profile or is no longer approved.',
    }
  revalidateListings(input.slug)
  revalidatePath('/admin/applications')
  revalidatePath(`/admin/applications/${applicationId}`)
  redirect(`/admin/professionals/${profileId}/edit`)
}

class ApplicationAlreadyLinkedError extends Error {}

export async function updateProfessional(
  id: string,
  _state: ProfessionalActionState,
  formData: FormData,
): Promise<ProfessionalActionState> {
  const admin = await requireAdmin()
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { error: 'Invalid profile.' }
  const input = parse(formData)
  if (isError(input)) return input
  let previousSlug: string
  try {
    const outcome = await authDb.transaction(async (tx) => {
      const [existing] = await tx
        .select({
          slug: professionals.slug,
          publicationStatus: professionals.publicationStatus,
          verificationStatus: professionals.verificationStatus,
        })
        .from(professionals)
        .where(eq(professionals.id, id))
        .limit(1)
      if (!existing) return null
      await tx
        .update(professionals)
        .set({
          ...values(input),
          publishedAt:
            input.publicationStatus === 'published'
              ? existing.publicationStatus === 'published'
                ? undefined
                : new Date()
              : null,
          verifiedAt:
            input.verificationStatus === 'verified'
              ? existing.verificationStatus === 'verified'
                ? undefined
                : new Date()
              : null,
          verifiedByAdminId:
            input.verificationStatus === 'verified'
              ? existing.verificationStatus === 'verified'
                ? undefined
                : admin.id
              : null,
        })
        .where(eq(professionals.id, id))
      return existing.slug
    })
    if (!outcome) return { error: 'Profile no longer exists.' }
    previousSlug = outcome
  } catch (error) {
    return writeError(error)
  }
  revalidateListings(input.slug, previousSlug)
  redirect('/admin/professionals')
}
