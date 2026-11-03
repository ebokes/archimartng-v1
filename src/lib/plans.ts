import 'server-only'

import { and, asc, desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { planImages, plans } from '@/db/schema'
import { requireAdmin } from './require-admin'

export async function getPublishedPlans() {
  return db
    .select({
      id: plans.id,
      slug: plans.slug,
      title: plans.title,
      summary: plans.summary,
      propertyType: plans.propertyType,
      bedrooms: plans.bedrooms,
      bathrooms: plans.bathrooms,
      floorAreaSqm: plans.floorAreaSqm,
      coverUrl: planImages.imageUrl,
      coverAlt: planImages.altText,
    })
    .from(plans)
    .leftJoin(
      planImages,
      and(eq(planImages.planId, plans.id), eq(planImages.isCover, true)),
    )
    .where(eq(plans.publicationStatus, 'published'))
    .orderBy(desc(plans.publishedAt), desc(plans.id))
}

export async function getPublishedPlan(slug: string) {
  const [plan] = await db
    .select()
    .from(plans)
    .where(and(eq(plans.slug, slug), eq(plans.publicationStatus, 'published')))
    .limit(1)
  if (!plan) return null
  const images = await db
    .select()
    .from(planImages)
    .where(eq(planImages.planId, plan.id))
    .orderBy(asc(planImages.sortOrder))
  return { ...plan, images }
}

export async function getAdminPlans() {
  await requireAdmin()
  return db
    .select({
      id: plans.id,
      slug: plans.slug,
      title: plans.title,
      propertyType: plans.propertyType,
      publicationStatus: plans.publicationStatus,
      updatedAt: plans.updatedAt,
    })
    .from(plans)
    .orderBy(desc(plans.updatedAt), desc(plans.id))
}

export async function getAdminPlan(id: string) {
  await requireAdmin()
  const [plan] = await db.select().from(plans).where(eq(plans.id, id)).limit(1)
  if (!plan) return null
  const [cover] = await db
    .select()
    .from(planImages)
    .where(and(eq(planImages.planId, id), eq(planImages.isCover, true)))
    .limit(1)
  return { ...plan, cover: cover ?? null }
}
