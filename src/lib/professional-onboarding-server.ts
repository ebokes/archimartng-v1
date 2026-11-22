import 'server-only'

import { and, eq, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { authDb } from '@/db/auth-client'
import { user } from '@/db/auth-schema'
import {
  admins,
  enquiries,
  marketplaceAccounts,
  professionalAccountEvents,
  professionalAccounts,
  professionalApplications,
} from '@/db/schema'
import { auth } from './auth'
import {
  isDisposableProfessionalOnboardingPageEnabled,
  isDisposableProfessionalStatusPageEnabled,
  mayStartDisposableProfessionalOnboarding,
  mayViewDisposableProfessionalStatus,
} from './professional-onboarding-gate'
import {
  createProfessionalOnboardingBoundary,
  ProfessionalOnboardingError,
} from './professional-onboarding-boundary'
import { requireProfessionalStatus } from './require-marketplace-account'

// Only the gated local action invokes this operation. The subject always comes
// from the validated Better Auth session and is rechecked under an identity lock.
const startInTrustedSession = createProfessionalOnboardingBoundary({
  async getIdentity() {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return null
    if (!mayStartDisposableProfessionalOnboarding(session.user.id)) return null
    return { id: session.user.id, emailVerified: session.user.emailVerified }
  },
  withLockedIdentity: (subject, operation) =>
    authDb.transaction(async (tx) => {
      // Administrator provisioning and client creation take the same lock.
      const locked = await tx.execute(
        sql`SELECT id FROM auth."user" WHERE id = ${subject} FOR UPDATE`,
      )
      const [identity] = await tx
        .select({ emailVerified: user.emailVerified, email: user.email })
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
        async hasPotentialPriorActivity() {
          if (!identity?.email) return true
          // Conservative safety check only. Matching an email does not prove
          // ownership, and these records are never linked to the new account.
          const [priorEnquiry] = await tx
            .select({ id: enquiries.id })
            .from(enquiries)
            .where(sql`lower(${enquiries.email}) = lower(${identity.email})`)
            .limit(1)
          const [priorApplication] = await tx
            .select({ id: professionalApplications.id })
            .from(professionalApplications)
            .where(
              sql`lower(${professionalApplications.email}) = lower(${identity.email})`,
            )
            .limit(1)
          return Boolean(priorEnquiry || priorApplication)
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
  if (!isDisposableProfessionalOnboardingPageEnabled())
    throw new ProfessionalOnboardingError()
  return startInTrustedSession()
}

// The private status page exposes only the current decision for its own subject.
// The resolver checks the session and account state; approval grants no profile access.
export async function getOwnProfessionalOnboardingStatus() {
  if (!isDisposableProfessionalStatusPageEnabled())
    throw new ProfessionalOnboardingError()
  const account = await requireProfessionalStatus()
  if (!mayViewDisposableProfessionalStatus(account.authSubject))
    throw new ProfessionalOnboardingError()
  if (
    account.approvalStatus !== 'pending' &&
    account.approvalStatus !== 'rejected' &&
    account.approvalStatus !== 'approved'
  )
    throw new ProfessionalOnboardingError()
  return { approvalStatus: account.approvalStatus }
}
