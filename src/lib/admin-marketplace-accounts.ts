import 'server-only'

import { desc, eq } from 'drizzle-orm'
import { authDb } from '@/db/auth-client'
import { user } from '@/db/auth-schema'
import {
  admins,
  marketplaceAccountEvents,
  marketplaceAccounts,
  professionalAccounts,
} from '@/db/schema'
import { changeAdminMarketplaceAccountStatus } from './admin-marketplace-account-status'
import {
  createAccountStatusAdminInterface,
  isLocalAccountStatusManagementEnabled,
} from './marketplace-account-status-admin-interface'
import { requireAdmin } from './require-admin'

export { isLocalAccountStatusManagementEnabled }

const interfaceAdapter = createAccountStatusAdminInterface({
  requireAdministrator: requireAdmin,
  enabled: isLocalAccountStatusManagementEnabled,
  async list() {
    return authDb
      .select({
        id: marketplaceAccounts.id,
        name: user.name,
        email: user.email,
        role: marketplaceAccounts.role,
        status: marketplaceAccounts.status,
        approvalStatus: professionalAccounts.approvalStatus,
      })
      .from(marketplaceAccounts)
      .innerJoin(user, eq(user.id, marketplaceAccounts.authSubject))
      .leftJoin(
        professionalAccounts,
        eq(professionalAccounts.accountId, marketplaceAccounts.id),
      )
      .orderBy(desc(marketplaceAccounts.createdAt))
      .limit(50)
  },
  async detail(id) {
    const [account] = await authDb
      .select({
        id: marketplaceAccounts.id,
        name: user.name,
        email: user.email,
        role: marketplaceAccounts.role,
        status: marketplaceAccounts.status,
        approvalStatus: professionalAccounts.approvalStatus,
      })
      .from(marketplaceAccounts)
      .innerJoin(user, eq(user.id, marketplaceAccounts.authSubject))
      .leftJoin(
        professionalAccounts,
        eq(professionalAccounts.accountId, marketplaceAccounts.id),
      )
      .where(eq(marketplaceAccounts.id, id))
      .limit(1)
    if (!account) return null
    const events = await authDb
      .select({
        id: marketplaceAccountEvents.id,
        action: marketplaceAccountEvents.action,
        reason: marketplaceAccountEvents.reason,
        createdAt: marketplaceAccountEvents.createdAt,
        actorName: admins.name,
      })
      .from(marketplaceAccountEvents)
      .innerJoin(admins, eq(admins.id, marketplaceAccountEvents.actorAdminId))
      .where(eq(marketplaceAccountEvents.accountId, id))
      .orderBy(desc(marketplaceAccountEvents.createdAt))
      .limit(50)
    return { ...account, events }
  },
  change: changeAdminMarketplaceAccountStatus,
})

export const listAdminMarketplaceAccounts = interfaceAdapter.list
export const getAdminMarketplaceAccount = interfaceAdapter.detail
export const changeMarketplaceAccountStatusFromAdmin = interfaceAdapter.change
