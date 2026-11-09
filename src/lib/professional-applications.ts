import 'server-only'

import { desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { professionalApplications } from '@/db/schema'
import { requireAdmin } from '@/lib/require-admin'

export async function getAdminApplications() {
  await requireAdmin()
  return db
    .select({
      id: professionalApplications.id,
      applicantName: professionalApplications.applicantName,
      email: professionalApplications.email,
      specialty: professionalApplications.specialty,
      status: professionalApplications.status,
      createdAt: professionalApplications.createdAt,
    })
    .from(professionalApplications)
    .orderBy(
      desc(professionalApplications.createdAt),
      desc(professionalApplications.id),
    )
}

export async function getAdminApplication(id: string) {
  await requireAdmin()
  const [application] = await db
    .select()
    .from(professionalApplications)
    .where(eq(professionalApplications.id, id))
    .limit(1)
  return application ?? null
}
