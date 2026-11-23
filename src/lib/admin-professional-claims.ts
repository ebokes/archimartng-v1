import 'server-only'

import { and, asc, eq, isNull, sql } from 'drizzle-orm'
import { authDb } from '@/db/auth-client'
import { user } from '@/db/auth-schema'
import {
  admins,
  marketplaceAccounts,
  professionalAccountEvents,
  professionalAccounts,
  professionalApplications,
  professionals,
} from '@/db/schema'
import { isLocalProfessionalAccountReviewEnabled } from './admin-professional-accounts'
import {
  createProfessionalProfileClaimBoundary,
  ProfessionalProfileClaimError,
} from './professional-profile-claim-boundary'
import { requireAdmin } from './require-admin'

export async function getUnownedProfessionalProfiles() {
  await requireAdmin()
  if (!isLocalProfessionalAccountReviewEnabled())
    throw new ProfessionalProfileClaimError()
  return authDb
    .select({
      id: professionals.id,
      displayName: professionals.displayName,
      specialty: professionals.specialty,
      city: professionals.city,
      state: professionals.state,
      publicationStatus: professionals.publicationStatus,
      verificationStatus: professionals.verificationStatus,
    })
    .from(professionals)
    .leftJoin(
      professionalAccounts,
      eq(professionalAccounts.profileId, professionals.id),
    )
    .where(isNull(professionalAccounts.accountId))
    .orderBy(asc(professionals.displayName))
    .limit(100)
}

export async function getLinkedClaimApplication(applicationId: string) {
  await requireAdmin()
  if (!isLocalProfessionalAccountReviewEnabled())
    throw new ProfessionalProfileClaimError()
  const [application] = await authDb
    .select({
      applicantName: professionalApplications.applicantName,
      specialty: professionalApplications.specialty,
      status: professionalApplications.status,
      professionalId: professionalApplications.professionalId,
    })
    .from(professionalApplications)
    .where(eq(professionalApplications.id, applicationId))
    .limit(1)
  return application ?? null
}

const claimInTransaction = createProfessionalProfileClaimBoundary({
  async requireAdministrator() {
    const admin = await requireAdmin()
    if (!isLocalProfessionalAccountReviewEnabled())
      throw new ProfessionalProfileClaimError()
    return { id: admin.id }
  },
  withLockedClaim: (accountId, profileId, operation) =>
    authDb.transaction(async (tx) => {
      // Lock the account first, then the profile. The second lock serializes
      // competing claims from different accounts for the same profile.
      const accountLock = await tx.execute(
        sql`SELECT account_id FROM professional_accounts WHERE account_id = ${accountId} FOR UPDATE`,
      )
      if (accountLock.length !== 1) return operation(null)
      const identityLock = await tx.execute(
        sql`SELECT ma.id FROM marketplace_accounts ma JOIN auth.user u ON u.id = ma.auth_subject WHERE ma.id = ${accountId} FOR UPDATE OF ma, u`,
      )
      if (identityLock.length !== 1) return operation(null)
      const profileLock = await tx.execute(
        sql`SELECT id FROM professionals WHERE id = ${profileId} FOR UPDATE`,
      )
      if (profileLock.length !== 1) return operation(null)

      return operation({
        async findState() {
          const [row] = await tx
            .select({
              authSubject: marketplaceAccounts.authSubject,
              role: marketplaceAccounts.role,
              status: marketplaceAccounts.status,
              approvalStatus: professionalAccounts.approvalStatus,
              emailVerified: user.emailVerified,
              currentProfileId: professionalAccounts.profileId,
              applicationId: professionalAccounts.applicationId,
            })
            .from(professionalAccounts)
            .innerJoin(
              marketplaceAccounts,
              eq(marketplaceAccounts.id, professionalAccounts.accountId),
            )
            .innerJoin(user, eq(user.id, marketplaceAccounts.authSubject))
            .where(eq(professionalAccounts.accountId, accountId))
            .limit(1)
          if (!row) return null

          const [admin] = await tx
            .select({ id: admins.id })
            .from(admins)
            .where(eq(admins.authSubject, row.authSubject))
            .limit(1)
          const [owner] = await tx
            .select({ accountId: professionalAccounts.accountId })
            .from(professionalAccounts)
            .where(eq(professionalAccounts.profileId, profileId))
            .limit(1)

          let linkedApplicationStatus: string | null = null
          let linkedApplicationProfileId: string | null = null
          if (row.applicationId) {
            const applicationLock = await tx.execute(
              sql`SELECT id FROM professional_applications WHERE id = ${row.applicationId} FOR UPDATE`,
            )
            if (applicationLock.length !== 1) return null
            const [application] = await tx
              .select({
                status: professionalApplications.status,
                professionalId: professionalApplications.professionalId,
              })
              .from(professionalApplications)
              .where(eq(professionalApplications.id, row.applicationId))
              .limit(1)
            if (!application) return null
            linkedApplicationStatus = application.status
            linkedApplicationProfileId = application.professionalId
          }

          return {
            authSubject: row.authSubject,
            role: row.role,
            status: row.status,
            approvalStatus: row.approvalStatus,
            emailVerified: row.emailVerified,
            hasAdministratorRecord: Boolean(admin),
            currentProfileId: row.currentProfileId,
            targetExists: true,
            targetOwnerAccountId: owner?.accountId ?? null,
            linkedApplicationStatus,
            linkedApplicationProfileId,
          }
        },
        async linkProfile(targetId, adminId, at) {
          const [updated] = await tx
            .update(professionalAccounts)
            .set({
              profileId: targetId,
              profileClaimedAt: at,
              profileClaimApprovedByAdminId: adminId,
              updatedAt: at,
            })
            .where(
              and(
                eq(professionalAccounts.accountId, accountId),
                eq(professionalAccounts.approvalStatus, 'approved'),
                isNull(professionalAccounts.profileId),
              ),
            )
            .returning({ accountId: professionalAccounts.accountId })
          return Boolean(updated)
        },
        async recordEvent(targetId, adminId, reason, at) {
          await tx.insert(professionalAccountEvents).values({
            accountId,
            profileId: targetId,
            actorAdminId: adminId,
            eventType: 'profile_claim_approved',
            reason,
            createdAt: at,
          })
        },
      })
    }),
})

export async function claimAdminProfessionalProfile(input: {
  accountId: string
  profileId: string
  evidenceSummary: string
  reason: string
  evidenceReviewed: boolean
}) {
  await claimInTransaction(input)
}
