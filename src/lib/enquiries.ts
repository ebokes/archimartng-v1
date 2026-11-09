import 'server-only'

import { desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { enquiries, enquiryNotes, plans, professionals } from '@/db/schema'
import { requireAdmin } from '@/lib/require-admin'

export async function getAdminEnquiries() {
  await requireAdmin()
  return db
    .select({
      id: enquiries.id,
      name: enquiries.name,
      status: enquiries.status,
      createdAt: enquiries.createdAt,
      planTitle: plans.title,
      professionalName: professionals.displayName,
    })
    .from(enquiries)
    .leftJoin(plans, eq(enquiries.planId, plans.id))
    .leftJoin(professionals, eq(enquiries.professionalId, professionals.id))
    .orderBy(desc(enquiries.createdAt), desc(enquiries.id))
}

export async function getAdminEnquiry(id: string) {
  await requireAdmin()
  const [enquiry] = await db
    .select({
      id: enquiries.id,
      name: enquiries.name,
      email: enquiries.email,
      phone: enquiries.phone,
      message: enquiries.message,
      status: enquiries.status,
      consentVersion: enquiries.consentVersion,
      consentedAt: enquiries.consentedAt,
      createdAt: enquiries.createdAt,
      planTitle: plans.title,
      planSlug: plans.slug,
      professionalName: professionals.displayName,
      professionalSlug: professionals.slug,
    })
    .from(enquiries)
    .leftJoin(plans, eq(enquiries.planId, plans.id))
    .leftJoin(professionals, eq(enquiries.professionalId, professionals.id))
    .where(eq(enquiries.id, id))
    .limit(1)
  if (!enquiry) return null
  const notes = await db
    .select({
      id: enquiryNotes.id,
      body: enquiryNotes.body,
      createdAt: enquiryNotes.createdAt,
    })
    .from(enquiryNotes)
    .where(eq(enquiryNotes.enquiryId, id))
    .orderBy(desc(enquiryNotes.createdAt), desc(enquiryNotes.id))
  return { ...enquiry, notes }
}
