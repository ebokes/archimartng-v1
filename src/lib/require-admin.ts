import 'server-only'

import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { db } from '@/db'
import { admins } from '@/db/schema'
import { auth } from './auth'

export async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  const authSubject = session?.user?.id

  if (!authSubject) {
    throw new Error('Unauthorized')
  }

  const [admin] = await db
    .select()
    .from(admins)
    .where(and(eq(admins.authSubject, authSubject), eq(admins.isActive, true)))
    .limit(1)

  if (!admin) {
    throw new Error('Forbidden')
  }

  return admin
}
