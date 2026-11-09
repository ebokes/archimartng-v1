import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { config } from 'dotenv'
import { and, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { assertDevelopmentConnection } from '../src/db/development-branch'
import {
  admins,
  professionalApplications,
  professionals,
} from '../src/db/schema'

config({ path: '.env.local', quiet: true })

async function main() {
  // This guard runs regardless of NODE_ENV and before any database connection.
  assertDevelopmentConnection(
    process.env.DATABASE_URL,
    process.env.DATABASE_URL_DIRECT,
    process.env.NEON_DEVELOPMENT_ENDPOINT_ID,
  )
  const client = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false })
  const db = drizzle(client)
  const slug = `professional-check-${randomUUID()}`
  const email = `${slug}@example.invalid`
  const rollback = new Error('Rollback professional check')
  try {
    try {
      await db.transaction(async (tx) => {
        const [admin] = await tx
          .select({ id: admins.id })
          .from(admins)
          .where(eq(admins.isActive, true))
          .limit(1)
        assert.ok(admin, 'No active development administrator exists')

        const [profile] = await tx
          .insert(professionals)
          .values({
            slug,
            displayName: 'Temporary Professional',
            bio: 'Temporary profile for the development transaction check.',
            specialty: 'Architecture',
            country: 'Nigeria',
            publicationStatus: 'draft',
            verificationStatus: 'unverified',
            createdByAdminId: admin.id,
          })
          .returning({ id: professionals.id })

        const [hidden] = await tx
          .select({ id: professionals.id })
          .from(professionals)
          .where(
            and(
              eq(professionals.id, profile.id),
              eq(professionals.publicationStatus, 'published'),
            ),
          )
          .limit(1)
        assert.equal(
          hidden,
          undefined,
          'Draft appeared in public listing query',
        )

        const [application] = await tx
          .insert(professionalApplications)
          .values({
            applicantName: 'Temporary Applicant',
            email,
            specialty: 'Architecture',
            message:
              'Temporary application for the development transaction check.',
          })
          .returning({ id: professionalApplications.id })
        await tx
          .update(professionalApplications)
          .set({
            status: 'under_review',
            reviewNotes: 'Manual test review note',
            reviewedAt: new Date(),
            reviewedByAdminId: admin.id,
          })
          .where(eq(professionalApplications.id, application.id))
        const [reviewed] = await tx
          .select({
            status: professionalApplications.status,
            reviewNotes: professionalApplications.reviewNotes,
            reviewedByAdminId: professionalApplications.reviewedByAdminId,
          })
          .from(professionalApplications)
          .where(eq(professionalApplications.id, application.id))
          .limit(1)
        assert.equal(reviewed?.status, 'under_review')
        assert.equal(reviewed?.reviewNotes, 'Manual test review note')
        assert.equal(reviewed?.reviewedByAdminId, admin.id)

        await tx
          .update(professionals)
          .set({
            publicationStatus: 'published',
            publishedAt: new Date(),
          })
          .where(eq(professionals.id, profile.id))
        const [publishedUnverified] = await tx
          .select({
            verificationStatus: professionals.verificationStatus,
          })
          .from(professionals)
          .where(
            and(
              eq(professionals.id, profile.id),
              eq(professionals.publicationStatus, 'published'),
            ),
          )
          .limit(1)
        assert.equal(publishedUnverified?.verificationStatus, 'unverified')

        await tx
          .update(professionals)
          .set({
            verificationStatus: 'verified',
            verifiedAt: new Date(),
            verifiedByAdminId: admin.id,
          })
          .where(eq(professionals.id, profile.id))
        const [verified] = await tx
          .select({
            verificationStatus: professionals.verificationStatus,
            verifiedAt: professionals.verifiedAt,
            verifiedByAdminId: professionals.verifiedByAdminId,
          })
          .from(professionals)
          .where(eq(professionals.id, profile.id))
          .limit(1)
        assert.equal(verified?.verificationStatus, 'verified')
        assert.ok(verified?.verifiedAt)
        assert.equal(verified?.verifiedByAdminId, admin.id)

        throw rollback
      })
    } catch (error) {
      if (error !== rollback) throw error
    }
    const [remainingProfile] = await db
      .select({ id: professionals.id })
      .from(professionals)
      .where(eq(professionals.slug, slug))
      .limit(1)
    const [remainingApplication] = await db
      .select({ id: professionalApplications.id })
      .from(professionalApplications)
      .where(eq(professionalApplications.email, email))
      .limit(1)
    assert.equal(
      remainingProfile,
      undefined,
      'Temporary profile remained after rollback',
    )
    assert.equal(
      remainingApplication,
      undefined,
      'Temporary application remained after rollback',
    )
    console.log(
      'Development professional transaction check passed; test data rolled back.',
    )
  } finally {
    await client.end()
  }
}

main().catch(() => {
  // Driver errors can contain connection details; do not print the original.
  console.error('Development professional transaction check failed.')
  process.exitCode = 1
})
