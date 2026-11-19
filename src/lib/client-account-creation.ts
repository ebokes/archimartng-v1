import 'server-only'

import { eq, sql } from 'drizzle-orm'
import { authDb } from '@/db/auth-client'
import { admins, marketplaceAccounts } from '@/db/schema'
import {
  createClientAccountCreationBoundary,
  type AuthorizedClientIdentity,
} from './client-account-creation-boundary'

// Keep this unmounted until a reviewed Better Auth registration/recovery flow
// can supply an identity established by that flow. A request may not supply it.
export function prepareClientAccountCreation(
  getAuthorizedIdentity: () => Promise<AuthorizedClientIdentity | null>,
) {
  return createClientAccountCreationBoundary({
    getAuthorizedIdentity,
    withLockedIdentity: (subject, operation) =>
      authDb.transaction(async (tx) => {
        // Administrator provisioning takes this same row lock before checking
        // membership. It serializes creation and recovery for one auth subject.
        const locked = await tx.execute(
          sql`SELECT id FROM auth."user" WHERE id = ${subject} FOR UPDATE`,
        )
        return operation({
          exists: locked.length === 1,
          async hasAdministratorRecord() {
            const [row] = await tx
              .select({ id: admins.id })
              .from(admins)
              .where(eq(admins.authSubject, subject))
              .limit(1)
            return Boolean(row)
          },
          async findMarketplaceAccount() {
            const [row] = await tx
              .select({
                id: marketplaceAccounts.id,
                role: marketplaceAccounts.role,
              })
              .from(marketplaceAccounts)
              .where(eq(marketplaceAccounts.authSubject, subject))
              .limit(1)
            return row ?? null
          },
          async insertClientAccount() {
            const [row] = await tx
              .insert(marketplaceAccounts)
              .values({
                authSubject: subject,
                role: 'client',
                status: 'active',
              })
              .returning({ id: marketplaceAccounts.id })
            return row
          },
        })
      }),
  })
}
