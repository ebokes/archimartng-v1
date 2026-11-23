import 'server-only'

import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import { authDb } from '@/db/auth-client'
import { user } from '@/db/auth-schema'
import {
  admins,
  marketplaceAccounts,
  professionalAccountEvents,
  professionalAccounts,
} from '@/db/schema'
import {
  createProfessionalAccountReviewBoundary,
  ProfessionalAccountReviewError,
} from './professional-account-review-boundary'
import { requireAdmin } from './require-admin'

// V2 account tables have only been migrated to development. Do not mount this
// review surface on Preview or Production before their separate rollout.
export function isLocalProfessionalAccountReviewEnabled() {
  return process.env.NODE_ENV === 'development' && !process.env.VERCEL_ENV
}

export async function getAdminProfessionalAccounts() {
  await requireAdmin()
  if (!isLocalProfessionalAccountReviewEnabled())
    throw new ProfessionalAccountReviewError()
  return authDb
    .select({
      accountId: professionalAccounts.accountId,
      name: user.name,
      email: user.email,
      approvalStatus: professionalAccounts.approvalStatus,
      createdAt: professionalAccounts.createdAt,
    })
    .from(professionalAccounts)
    .innerJoin(
      marketplaceAccounts,
      eq(marketplaceAccounts.id, professionalAccounts.accountId),
    )
    .innerJoin(user, eq(user.id, marketplaceAccounts.authSubject))
    .where(
      and(
        eq(marketplaceAccounts.role, 'professional'),
        isNull(professionalAccounts.profileId),
      ),
    )
    .orderBy(desc(professionalAccounts.createdAt))
    .limit(50)
}

export async function getAdminProfessionalAccount(accountId: string) {
  await requireAdmin()
  if (!isLocalProfessionalAccountReviewEnabled())
    throw new ProfessionalAccountReviewError()
  if (!/^[0-9a-f-]{36}$/i.test(accountId)) return null

  const [account] = await authDb
    .select({
      accountId: professionalAccounts.accountId,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      role: marketplaceAccounts.role,
      accountStatus: marketplaceAccounts.status,
      approvalStatus: professionalAccounts.approvalStatus,
      profileId: professionalAccounts.profileId,
      applicationId: professionalAccounts.applicationId,
      createdAt: professionalAccounts.createdAt,
      reviewedAt: professionalAccounts.reviewedAt,
      reviewedByAdminId: professionalAccounts.reviewedByAdminId,
    })
    .from(professionalAccounts)
    .innerJoin(
      marketplaceAccounts,
      eq(marketplaceAccounts.id, professionalAccounts.accountId),
    )
    .innerJoin(user, eq(user.id, marketplaceAccounts.authSubject))
    .where(eq(professionalAccounts.accountId, accountId))
    .limit(1)
  if (!account) return null

  const events = await authDb
    .select({
      id: professionalAccountEvents.id,
      eventType: professionalAccountEvents.eventType,
      profileId: professionalAccountEvents.profileId,
      reason: professionalAccountEvents.reason,
      createdAt: professionalAccountEvents.createdAt,
      actorName: admins.name,
    })
    .from(professionalAccountEvents)
    .leftJoin(admins, eq(admins.id, professionalAccountEvents.actorAdminId))
    .where(eq(professionalAccountEvents.accountId, accountId))
    .orderBy(desc(professionalAccountEvents.createdAt))
    .limit(50)

  return { ...account, events }
}

const reviewInTransaction = createProfessionalAccountReviewBoundary({
  async requireAdministrator() {
    const admin = await requireAdmin()
    if (!isLocalProfessionalAccountReviewEnabled())
      throw new ProfessionalAccountReviewError()
    return { id: admin.id }
  },
  withLockedAccount: (accountId, operation) =>
    authDb.transaction(async (tx) => {
      const locked = await tx.execute(
        sql`SELECT account_id FROM professional_accounts WHERE account_id = ${accountId} FOR UPDATE`,
      )
      if (locked.length !== 1) return operation(null)

      return operation({
        async findState() {
          const [row] = await tx
            .select({
              role: marketplaceAccounts.role,
              accountStatus: marketplaceAccounts.status,
              approvalStatus: professionalAccounts.approvalStatus,
              emailVerified: user.emailVerified,
              authSubject: user.id,
              profileId: professionalAccounts.profileId,
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
          return { ...row, hasAdministratorRecord: Boolean(admin) }
        },
        async updateDecision(current, next, adminId, at) {
          const [updated] = await tx
            .update(professionalAccounts)
            .set({
              approvalStatus: next,
              reviewedAt: at,
              reviewedByAdminId: adminId,
              updatedAt: at,
            })
            .where(
              and(
                eq(professionalAccounts.accountId, accountId),
                eq(professionalAccounts.approvalStatus, current),
              ),
            )
            .returning({ accountId: professionalAccounts.accountId })
          return Boolean(updated)
        },
        async recordEvent(type, reason, adminId, at) {
          await tx.insert(professionalAccountEvents).values({
            accountId,
            actorAdminId: adminId,
            eventType: type,
            reason,
            createdAt: at,
          })
        },
      })
    }),
})

export async function reviewAdminProfessionalAccount(input: {
  accountId: string
  decision: string
  reason: string
}) {
  await reviewInTransaction(input)
}
