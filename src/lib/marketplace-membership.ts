import 'server-only'

import { eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { marketplaceAccounts } from '@/db/schema'

// Production may not have migration 0003 yet. Absence of the table means
// marketplace membership cannot exist there; every present table is checked.
export async function hasMarketplaceMembership(subject: string) {
  const table = await db.execute(
    sql`SELECT to_regclass('public.marketplace_accounts') IS NOT NULL AS present`,
  )
  if (table.rows[0]?.present !== true) {
    if (table.rows[0]?.present !== false)
      throw new Error('Marketplace membership check unavailable')
    return false
  }
  const [account] = await db
    .select({ id: marketplaceAccounts.id })
    .from(marketplaceAccounts)
    .where(eq(marketplaceAccounts.authSubject, subject))
    .limit(1)
  return Boolean(account)
}
