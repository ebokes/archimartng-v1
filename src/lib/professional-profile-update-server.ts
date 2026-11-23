import 'server-only'

import { and, eq, sql } from 'drizzle-orm'
import { user } from '@/db/auth-schema'
import { authDb } from '@/db/auth-client'
import {
  admins,
  marketplaceAccounts,
  professionalAccounts,
  professionals,
} from '@/db/schema'
import { MarketplaceAccountAccessError } from './marketplace-account-authorization'
import { createProfessionalProfileUpdateBoundary } from './professional-profile-update-boundary'
import { requireApprovedProfessional } from './require-marketplace-account'

// Deliberately unmounted: a later reviewed Server Action may call this function.
export const updateOwnProfessionalProfile =
  createProfessionalProfileUpdateBoundary({
    requireApproved: requireApprovedProfessional,
    withLockedProfile: (accountId, operation) =>
      authDb.transaction(async (tx) => {
        // Match the administrator claim operation's lock order. Re-read state
        // only after these locks so suspension or ownership changes serialize.
        const accountLock = await tx.execute(
          sql`SELECT account_id FROM professional_accounts WHERE account_id = ${accountId} FOR UPDATE`,
        )
        if (accountLock.length !== 1) return operation(null)
        const identityLock = await tx.execute(
          sql`SELECT ma.id FROM marketplace_accounts ma JOIN auth.user u ON u.id = ma.auth_subject WHERE ma.id = ${accountId} FOR UPDATE OF ma, u`,
        )
        if (identityLock.length !== 1) return operation(null)

        const [link] = await tx
          .select({ profileId: professionalAccounts.profileId })
          .from(professionalAccounts)
          .where(eq(professionalAccounts.accountId, accountId))
          .limit(1)
        if (!link?.profileId) return operation(null)
        const profileId = link.profileId
        const profileLock = await tx.execute(
          sql`SELECT id FROM professionals WHERE id = ${profileId} FOR UPDATE`,
        )
        if (profileLock.length !== 1) return operation(null)

        return operation({
          async findState() {
            const [row] = await tx
              .select({
                id: marketplaceAccounts.id,
                authSubject: marketplaceAccounts.authSubject,
                role: marketplaceAccounts.role,
                status: marketplaceAccounts.status,
                approvalStatus: professionalAccounts.approvalStatus,
                emailVerified: user.emailVerified,
                profileId: professionalAccounts.profileId,
                publicationStatus: professionals.publicationStatus,
              })
              .from(professionalAccounts)
              .innerJoin(
                marketplaceAccounts,
                eq(marketplaceAccounts.id, professionalAccounts.accountId),
              )
              .innerJoin(user, eq(user.id, marketplaceAccounts.authSubject))
              .innerJoin(
                professionals,
                eq(professionals.id, professionalAccounts.profileId),
              )
              .where(eq(professionalAccounts.accountId, accountId))
              .limit(1)
            if (!row) return null
            const [admin] = await tx
              .select({ id: admins.id })
              .from(admins)
              .where(eq(admins.authSubject, row.authSubject))
              .limit(1)
            return {
              ...row,
              hasAdministratorRecord: Boolean(admin),
              ownerAccountId: row.profileId === profileId ? accountId : null,
            }
          },
          async updateProfile(targetId, changes) {
            if (targetId !== profileId)
              throw new MarketplaceAccountAccessError(403)
            const [updated] = await tx
              .update(professionals)
              .set({
                bio: changes.bio,
                websiteUrl: changes.websiteUrl,
                city: changes.city,
                state: changes.state,
                country: changes.country,
                updatedAt: new Date(),
              })
              .where(eq(professionals.id, profileId))
              .returning({ id: professionals.id })
            return Boolean(updated)
          },
        })
      }),
  })
