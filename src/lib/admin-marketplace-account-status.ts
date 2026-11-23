import 'server-only'

import { and, eq, sql } from 'drizzle-orm'
import { authDb } from '@/db/auth-client'
import { session, user } from '@/db/auth-schema'
import {
  admins,
  marketplaceAccountEvents,
  marketplaceAccounts,
  professionalAccounts,
} from '@/db/schema'
import {
  createMarketplaceAccountStatusBoundary,
  MarketplaceAccountStatusError,
} from './marketplace-account-status-boundary'
import { requireAdmin } from './require-admin'

// Unmounted until migration 0005 is approved and applied to development.
export const changeAdminMarketplaceAccountStatus =
  createMarketplaceAccountStatusBoundary({
    async requireAdministrator() {
      const admin = await requireAdmin()
      if (process.env.NODE_ENV !== 'development' || process.env.VERCEL_ENV)
        throw new MarketplaceAccountStatusError()
      return { id: admin.id }
    },
    withLockedAccount: (accountId, adminId, operation) =>
      authDb.transaction(async (tx) => {
        const adminLock = await tx.execute(
          sql`SELECT id FROM admins WHERE id = ${adminId} AND is_active = true FOR UPDATE`,
        )
        if (adminLock.length !== 1) return operation(null)

        const [candidate] = await tx
          .select({
            role: marketplaceAccounts.role,
            authSubject: marketplaceAccounts.authSubject,
          })
          .from(marketplaceAccounts)
          .where(eq(marketplaceAccounts.id, accountId))
          .limit(1)
        if (!candidate) return operation(null)

        // Professional mutations already lock professional_accounts first.
        // Client onboarding locks auth.user first. Follow those orders here.
        if (candidate.role === 'professional') {
          const professionalLock = await tx.execute(
            sql`SELECT account_id FROM professional_accounts WHERE account_id = ${accountId} FOR UPDATE`,
          )
          if (professionalLock.length !== 1) return operation(null)
        }
        const identityLock = await tx.execute(
          sql`SELECT id FROM auth."user" WHERE id = ${candidate.authSubject} FOR UPDATE`,
        )
        if (identityLock.length !== 1) return operation(null)
        const accountLock = await tx.execute(
          sql`SELECT id FROM marketplace_accounts WHERE id = ${accountId} FOR UPDATE`,
        )
        if (accountLock.length !== 1) return operation(null)

        return operation({
          async findState() {
            const [row] = await tx
              .select({
                authSubject: marketplaceAccounts.authSubject,
                role: marketplaceAccounts.role,
                status: marketplaceAccounts.status,
                professionalId: professionalAccounts.accountId,
                approvalStatus: professionalAccounts.approvalStatus,
              })
              .from(marketplaceAccounts)
              .innerJoin(user, eq(user.id, marketplaceAccounts.authSubject))
              .leftJoin(
                professionalAccounts,
                eq(professionalAccounts.accountId, marketplaceAccounts.id),
              )
              .where(eq(marketplaceAccounts.id, accountId))
              .limit(1)
            if (!row || row.authSubject !== candidate.authSubject) return null
            const [overlap] = await tx
              .select({ id: admins.id })
              .from(admins)
              .where(eq(admins.authSubject, row.authSubject))
              .limit(1)
            return {
              authSubject: row.authSubject,
              role: row.role,
              status: row.status,
              hasAdministratorRecord: Boolean(overlap),
              hasProfessionalAccount: row.professionalId !== null,
              approvalStatus: row.approvalStatus,
            }
          },
          async changeStatus(current, next, at) {
            const [changed] = await tx
              .update(marketplaceAccounts)
              .set({
                status: next,
                suspendedAt: next === 'suspended' ? at : null,
                updatedAt: at,
              })
              .where(
                and(
                  eq(marketplaceAccounts.id, accountId),
                  eq(marketplaceAccounts.status, current),
                ),
              )
              .returning({ id: marketplaceAccounts.id })
            return Boolean(changed)
          },
          async recordEvent(action, actorAdminId, reason, at) {
            await tx.insert(marketplaceAccountEvents).values({
              accountId,
              actorAdminId,
              action,
              reason,
              createdAt: at,
            })
          },
          async revokeSessions(subject) {
            if (subject !== candidate.authSubject)
              throw new MarketplaceAccountStatusError()
            // Better Auth's sessions live in this same PostgreSQL database;
            // cookie caching is disabled. A deletion failure rolls back status
            // and event as well, so there is no partially revoked success.
            await tx.delete(session).where(eq(session.userId, subject))
          },
        })
      }),
  })
