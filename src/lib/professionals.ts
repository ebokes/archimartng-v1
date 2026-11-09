import 'server-only'

import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { professionals } from '@/db/schema'
import { requireAdmin } from '@/lib/require-admin'

export async function getPublishedProfessionals() {
  return db
    .select({
      id: professionals.id,
      slug: professionals.slug,
      displayName: professionals.displayName,
      headline: professionals.headline,
      specialty: professionals.specialty,
      city: professionals.city,
      state: professionals.state,
      country: professionals.country,
      verificationStatus: professionals.verificationStatus,
    })
    .from(professionals)
    .where(eq(professionals.publicationStatus, 'published'))
    .orderBy(desc(professionals.publishedAt), desc(professionals.id))
}

export async function getPublishedProfessional(slug: string) {
  const [professional] = await db
    .select({
      slug: professionals.slug,
      displayName: professionals.displayName,
      headline: professionals.headline,
      bio: professionals.bio,
      specialty: professionals.specialty,
      city: professionals.city,
      state: professionals.state,
      country: professionals.country,
      verificationStatus: professionals.verificationStatus,
    })
    .from(professionals)
    .where(
      and(
        eq(professionals.slug, slug),
        eq(professionals.publicationStatus, 'published'),
      ),
    )
    .limit(1)
  return professional ?? null
}

export async function getAdminProfessionals() {
  await requireAdmin()
  return db
    .select({
      id: professionals.id,
      slug: professionals.slug,
      displayName: professionals.displayName,
      specialty: professionals.specialty,
      publicationStatus: professionals.publicationStatus,
      verificationStatus: professionals.verificationStatus,
    })
    .from(professionals)
    .orderBy(desc(professionals.updatedAt), desc(professionals.id))
}

export async function getAdminProfessional(id: string) {
  await requireAdmin()
  const [profile] = await db
    .select()
    .from(professionals)
    .where(eq(professionals.id, id))
    .limit(1)
  return profile ?? null
}
