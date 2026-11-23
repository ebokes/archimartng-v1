import 'server-only'

import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { professionalAccounts, professionals } from '@/db/schema'
import { createOwnProfessionalProfileReader } from './own-professional-profile-boundary'
import { requireApprovedProfessional } from './require-marketplace-account'

export const getOwnProfessionalProfile = createOwnProfessionalProfileReader({
  requireApproved: requireApprovedProfessional,
  async findOwned(accountId, profileId) {
    const [row] = await db
      .select({
        ownerAccountId: professionalAccounts.accountId,
        id: professionals.id,
        slug: professionals.slug,
        displayName: professionals.displayName,
        headline: professionals.headline,
        bio: professionals.bio,
        specialty: professionals.specialty,
        city: professionals.city,
        state: professionals.state,
        country: professionals.country,
        websiteUrl: professionals.websiteUrl,
        publicationStatus: professionals.publicationStatus,
        verificationStatus: professionals.verificationStatus,
      })
      .from(professionalAccounts)
      .innerJoin(
        professionals,
        eq(professionals.id, professionalAccounts.profileId),
      )
      .where(
        and(
          eq(professionalAccounts.accountId, accountId),
          eq(professionalAccounts.profileId, profileId),
        ),
      )
      .limit(1)
    return row ?? null
  },
})
