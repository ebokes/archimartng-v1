'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { authDb } from '@/db/auth-client'
import { planImages, plans } from '@/db/schema'
import { discardPlanImage, uploadPlanImage } from '@/lib/plan-image-storage'
import { parsePlanForm, type PlanInput } from '@/lib/plan-input'
import { requireAdmin } from '@/lib/require-admin'

export type PlanActionState = { error: string | null }

function planValues(input: PlanInput) {
  return {
    title: input.title,
    slug: input.slug,
    summary: input.summary,
    description: input.description,
    propertyType: input.propertyType,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    floors: input.floors,
    plotAreaSqm: input.plotAreaSqm,
    floorAreaSqm: input.floorAreaSqm,
    publicationStatus: input.publicationStatus,
  }
}

function parse(formData: FormData): PlanInput | PlanActionState {
  const result = parsePlanForm(formData)
  if (result.success) return result.data
  return {
    error: result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join(' '),
  }
}

function isError(value: PlanInput | PlanActionState): value is PlanActionState {
  return 'error' in value
}

function writeError(error: unknown): PlanActionState {
  // PostgreSQL unique violation; do not reveal SQL or connection details.
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505'
  ) {
    return { error: 'This slug is already in use.' }
  }
  throw error
}

type CoverResult = { error: string } | { url: string; key: string | null }

async function coverFromForm(
  formData: FormData,
  input: PlanInput,
): Promise<CoverResult> {
  const file = formData.get('coverFile')
  if (file !== null && !(file instanceof File))
    return { error: 'Choose a valid image file.' }
  if (file instanceof File && file.size > 0) {
    if (input.coverUrl)
      return { error: 'Choose either an image URL or an upload.' }
    try {
      return await uploadPlanImage(file)
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Image upload failed.',
      }
    }
  }
  return { url: input.coverUrl, key: null }
}

export async function createPlan(
  _state: PlanActionState,
  formData: FormData,
): Promise<PlanActionState> {
  const admin = await requireAdmin()
  const input = parse(formData)
  if (isError(input)) return input
  const coverImage = await coverFromForm(formData, input)
  if ('error' in coverImage) return coverImage

  try {
    await authDb.transaction(async (tx) => {
      const [plan] = await tx
        .insert(plans)
        .values({
          ...planValues(input),
          publishedAt:
            input.publicationStatus === 'published' ? new Date() : null,
          createdByAdminId: admin.id,
        })
        .returning({ id: plans.id })
      if (coverImage.url)
        await tx.insert(planImages).values({
          planId: plan.id,
          imageUrl: coverImage.url,
          altText: input.coverAlt,
          isCover: true,
          sortOrder: 0,
        })
    })
  } catch (error) {
    if (coverImage.key) await discardPlanImage(coverImage.key)
    return writeError(error)
  }

  revalidatePath('/plans')
  revalidatePath('/admin')
  revalidatePath('/admin/plans')
  redirect('/admin/plans')
}

export async function updatePlan(
  id: string,
  _state: PlanActionState,
  formData: FormData,
): Promise<PlanActionState> {
  await requireAdmin()
  const input = parse(formData)
  if (isError(input)) return input
  const coverImage = await coverFromForm(formData, input)
  if ('error' in coverImage) return coverImage

  try {
    const outcome = await authDb.transaction(async (tx) => {
      const [existing] = await tx
        .select({ publicationStatus: plans.publicationStatus })
        .from(plans)
        .where(eq(plans.id, id))
        .limit(1)
      if (!existing) return { error: 'Plan no longer exists.' }
      const [cover] = await tx
        .select({ id: planImages.id })
        .from(planImages)
        .where(and(eq(planImages.planId, id), eq(planImages.isCover, true)))
        .limit(1)
      if (cover && !coverImage.url)
        return { error: 'Replace the cover with another image URL or upload.' }
      await tx
        .update(plans)
        .set({
          ...planValues(input),
          publishedAt:
            input.publicationStatus === 'published'
              ? existing.publicationStatus === 'published'
                ? undefined
                : new Date()
              : null,
        })
        .where(eq(plans.id, id))
      if (coverImage.url) {
        if (cover) {
          await tx
            .update(planImages)
            .set({ imageUrl: coverImage.url, altText: input.coverAlt })
            .where(eq(planImages.id, cover.id))
        } else {
          await tx.insert(planImages).values({
            planId: id,
            imageUrl: coverImage.url,
            altText: input.coverAlt,
            isCover: true,
            sortOrder: 0,
          })
        }
      }
      return { error: null }
    })
    if (outcome.error) {
      if (coverImage.key) await discardPlanImage(coverImage.key)
      return outcome
    }
  } catch (error) {
    if (coverImage.key) await discardPlanImage(coverImage.key)
    return writeError(error)
  }

  revalidatePath('/plans')
  revalidatePath(`/plans/${input.slug}`)
  revalidatePath('/admin')
  revalidatePath('/admin/plans')
  redirect('/admin/plans')
}
