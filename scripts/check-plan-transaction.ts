import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { config } from 'dotenv'
import { and, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { assertDevelopmentConnection } from '../src/db/development-branch'
import { planImages, plans } from '../src/db/schema'

config({ path: '.env.local', quiet: true })

async function main() {
  // Always check the endpoint, even if NODE_ENV was set to production.
  assertDevelopmentConnection(
    process.env.DATABASE_URL,
    process.env.DATABASE_URL_DIRECT,
    process.env.NEON_DEVELOPMENT_ENDPOINT_ID,
  )

  const client = postgres(process.env.DATABASE_URL!, {
    max: 1,
    prepare: false,
  })
  const db = drizzle(client)
  const slug = `plan-check-${randomUUID()}`
  const rollback = new Error('Rollback plan check')

  try {
    try {
      await db.transaction(async (tx) => {
        const [draft] = await tx
          .insert(plans)
          .values({
            slug,
            title: 'Temporary plan draft',
            description:
              'Temporary plan used to check the development database transaction.',
            propertyType: 'Test',
            publicationStatus: 'draft',
          })
          .returning({ id: plans.id })

        const [hidden] = await tx
          .select({ id: plans.id })
          .from(plans)
          .where(
            and(
              eq(plans.id, draft.id),
              eq(plans.publicationStatus, 'published'),
            ),
          )
          .limit(1)
        assert.equal(hidden, undefined, 'Draft appeared as published')

        await tx
          .update(plans)
          .set({ title: 'Temporary edited plan' })
          .where(eq(plans.id, draft.id))
        await tx.insert(planImages).values({
          planId: draft.id,
          imageUrl: 'https://example.com/temporary-plan.jpg',
          altText: 'Temporary architectural plan image',
          isCover: true,
          sortOrder: 0,
        })
        await tx
          .update(plans)
          .set({ publicationStatus: 'published', publishedAt: new Date() })
          .where(eq(plans.id, draft.id))

        const [published] = await tx
          .select({
            title: plans.title,
            imageUrl: planImages.imageUrl,
          })
          .from(plans)
          .innerJoin(
            planImages,
            and(eq(planImages.planId, plans.id), eq(planImages.isCover, true)),
          )
          .where(
            and(
              eq(plans.id, draft.id),
              eq(plans.publicationStatus, 'published'),
            ),
          )
          .limit(1)
        assert.equal(published?.title, 'Temporary edited plan')
        assert.equal(
          published?.imageUrl,
          'https://example.com/temporary-plan.jpg',
        )

        throw rollback
      })
    } catch (error) {
      if (error !== rollback) throw error
    }

    const [remaining] = await db
      .select({ id: plans.id })
      .from(plans)
      .where(eq(plans.slug, slug))
      .limit(1)
    assert.equal(remaining, undefined, 'Temporary plan remained after rollback')
    console.log(
      'Development plan transaction check passed; test data rolled back.',
    )
  } finally {
    await client.end()
  }
}

main().catch(() => {
  // Driver errors can contain connection details; do not print the original.
  console.error('Development plan transaction check failed.')
  process.exitCode = 1
})
