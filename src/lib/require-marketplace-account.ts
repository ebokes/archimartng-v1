import 'server-only'

import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { db } from '@/db'
import { admins, marketplaceAccounts, professionalAccounts } from '@/db/schema'
import { auth } from './auth'
import { createMarketplaceAccountResolver } from './marketplace-account-resolver'

const resolver = createMarketplaceAccountResolver({
  async getIdentity() {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return null
    return {
      id: session.user.id,
      emailVerified: session.user.emailVerified,
    }
  },
  async findAccount(subject) {
    const [row] = await db
      .select({
        id: marketplaceAccounts.id,
        authSubject: marketplaceAccounts.authSubject,
        role: marketplaceAccounts.role,
        status: marketplaceAccounts.status,
        approvalStatus: professionalAccounts.approvalStatus,
        profileId: professionalAccounts.profileId,
        administratorIsActive: admins.isActive,
      })
      .from(marketplaceAccounts)
      .leftJoin(
        professionalAccounts,
        eq(professionalAccounts.accountId, marketplaceAccounts.id),
      )
      .leftJoin(admins, eq(admins.authSubject, marketplaceAccounts.authSubject))
      .where(eq(marketplaceAccounts.authSubject, subject))
      .limit(1)

    if (!row) return undefined
    return {
      account: {
        id: row.id,
        authSubject: row.authSubject,
        role: row.role,
        status: row.status,
        approvalStatus: row.approvalStatus,
        profileId: row.profileId,
      },
      administratorIsActive: row.administratorIsActive,
    }
  },
})

export const requireClientAccount = resolver.requireClient
export const requireProfessionalOnboarding =
  resolver.requireProfessionalOnboarding
export const requireApprovedProfessional = resolver.requireApprovedProfessional
