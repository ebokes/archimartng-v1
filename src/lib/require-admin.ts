import 'server-only'

import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { db } from '@/db'
import { admins } from '@/db/schema'
import { authorizeAdmin } from './admin-authorization'
import { auth } from './auth'

export async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  return authorizeAdmin(session?.user?.id, async (authSubject) => {
    const [admin] = await db
      .select()
      .from(admins)
      .where(eq(admins.authSubject, authSubject))
      .limit(1)

    return admin
  })
}
