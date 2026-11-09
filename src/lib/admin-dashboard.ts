import 'server-only'

import { desc, eq, inArray, sql } from 'drizzle-orm'
import { db } from '@/db'
import {
  enquiries,
  plans,
  professionalApplications,
  professionals,
} from '@/db/schema'
import { requireAdmin } from './require-admin'

export async function getAdminDashboard() {
  // This check belongs inside the data operation, not only in its caller.
  const admin = await requireAdmin()

  const [
    planRows,
    professionalRows,
    enquiryRows,
    applicationRows,
    recentEnquiries,
    recentApplications,
  ] = await Promise.all([
    db
      .select({
        published: sql<number>`count(*) filter (where ${plans.publicationStatus} = 'published')::int`,
        draft: sql<number>`count(*) filter (where ${plans.publicationStatus} = 'draft')::int`,
      })
      .from(plans),
    db
      .select({
        published: sql<number>`count(*) filter (where ${professionals.publicationStatus} = 'published')::int`,
        draft: sql<number>`count(*) filter (where ${professionals.publicationStatus} = 'draft')::int`,
        verified: sql<number>`count(*) filter (where ${professionals.verificationStatus} = 'verified')::int`,
      })
      .from(professionals),
    db
      .select({
        new: sql<number>`count(*) filter (where ${enquiries.status} = 'new')::int`,
        inProgress: sql<number>`count(*) filter (where ${enquiries.status} = 'in_progress')::int`,
      })
      .from(enquiries),
    db
      .select({
        submitted: sql<number>`count(*) filter (where ${professionalApplications.status} = 'submitted')::int`,
        underReview: sql<number>`count(*) filter (where ${professionalApplications.status} = 'under_review')::int`,
      })
      .from(professionalApplications),
    db
      .select({
        id: enquiries.id,
        name: enquiries.name,
        email: enquiries.email,
        phone: enquiries.phone,
        message: enquiries.message,
        status: enquiries.status,
        createdAt: enquiries.createdAt,
        planTitle: plans.title,
        professionalName: professionals.displayName,
      })
      .from(enquiries)
      .leftJoin(plans, eq(enquiries.planId, plans.id))
      .leftJoin(professionals, eq(enquiries.professionalId, professionals.id))
      .where(inArray(enquiries.status, ['new', 'in_progress']))
      .orderBy(desc(enquiries.createdAt), desc(enquiries.id))
      .limit(5),
    db
      .select({
        id: professionalApplications.id,
        applicantName: professionalApplications.applicantName,
        email: professionalApplications.email,
        phone: professionalApplications.phone,
        businessName: professionalApplications.businessName,
        specialty: professionalApplications.specialty,
        message: professionalApplications.message,
        status: professionalApplications.status,
        createdAt: professionalApplications.createdAt,
      })
      .from(professionalApplications)
      .where(
        inArray(professionalApplications.status, ['submitted', 'under_review']),
      )
      .orderBy(
        desc(professionalApplications.createdAt),
        desc(professionalApplications.id),
      )
      .limit(5),
  ])

  return {
    admin,
    counts: {
      plans: planRows[0],
      professionals: professionalRows[0],
      enquiries: enquiryRows[0],
      applications: applicationRows[0],
    },
    recentEnquiries,
    recentApplications,
  }
}
