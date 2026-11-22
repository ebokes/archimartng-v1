import 'server-only'

import { and, eq, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { authDb } from '@/db/auth-client'
import { user } from '@/db/auth-schema'
import {
  admins,
  marketplaceAccounts,
  professionalAccountEvents,
  professionalAccounts,
} from '@/db/schema'
import { auth } from './auth'
import {
  isProfessionalOnboardingEnabled,
  isProfessionalSessionAdmissionEnabled,
} from './client-session-admission'
import {
  createProfessionalOnboardingBoundary,
  ProfessionalOnboardingError,
} from './professional-onboarding-boundary'
import { requireProfessionalOnboarding } from './require-marketplace-account'

// Deliberately unmounted. A future reviewed action may invoke this operation
// after its own gate and request checks; the subject always comes from Better Auth.
const startInTrustedSession = createProfessionalOnboardingBoundary({
  async getIdentity() {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return null
    return { id: session.user.id, emailVerified: session.user.emailVerified }
  },
  withLockedIdentity: (subject, operation) =>
    authDb.transaction(async (tx) => {
      // Administrator provisioning and client creation take the same lock.
      const locked = await tx.execute(
        sql`SELECT id FROM auth."user" WHERE id = ${subject} FOR UPDATE`,
      )
      const [identity] = await tx
        .select({ emailVerified: user.emailVerified })
        .from(user)
        .where(eq(user.id, subject))
        .limit(1)

      return operation({
        exists: locked.length === 1 && Boolean(identity),
        emailVerified: identity?.emailVerified === true,
        async hasAdministratorRecord() {
          const [row] = await tx
            .select({ id: admins.id })
            .from(admins)
            .where(eq(admins.authSubject, subject))
            .limit(1)
          return Boolean(row)
        },
        async findAccount() {
          const [row] = await tx
            .select({
              id: marketplaceAccounts.id,
              authSubject: marketplaceAccounts.authSubject,
              role: marketplaceAccounts.role,
              status: marketplaceAccounts.status,
              professionalAccountId: professionalAccounts.accountId,
            })
            .from(marketplaceAccounts)
            .leftJoin(
              professionalAccounts,
              eq(professionalAccounts.accountId, marketplaceAccounts.id),
            )
            .where(eq(marketplaceAccounts.authSubject, subject))
            .limit(1)
          return row
            ? {
                ...row,
                hasProfessionalAccount: row.professionalAccountId !== null,
              }
            : null
        },
        async changeRoleToProfessional(accountId) {
          const [changed] = await tx
            .update(marketplaceAccounts)
            .set({ role: 'professional', updatedAt: new Date() })
            .where(
              and(
                eq(marketplaceAccounts.id, accountId),
                eq(marketplaceAccounts.authSubject, subject),
                eq(marketplaceAccounts.role, 'client'),
                eq(marketplaceAccounts.status, 'active'),
              ),
            )
            .returning({ id: marketplaceAccounts.id })
          return Boolean(changed)
        },
        async createPendingProfessionalAccount(accountId) {
          await tx.insert(professionalAccounts).values({
            accountId,
            approvalStatus: 'pending',
          })
        },
        async recordOnboardingStarted(accountId) {
          await tx.insert(professionalAccountEvents).values({
            accountId,
            eventType: 'onboarding_started',
          })
        },
      })
    }),
})

export async function startProfessionalOnboarding() {
  if (!isProfessionalOnboardingEnabled(process.env))
    throw new ProfessionalOnboardingError()
  return startInTrustedSession()
}

// Future status pages can expose only the current pending/rejected decision.
// The resolver gets the subject from the session and denies approved-only work.
export async function getOwnProfessionalOnboardingStatus() {
  if (!isProfessionalSessionAdmissionEnabled(process.env))
    throw new ProfessionalOnboardingError()
  const account = await requireProfessionalOnboarding()
  return { approvalStatus: account.approvalStatus }
}
