import { config } from 'dotenv'
import { assertDevelopmentConnection } from '../src/db/development-branch'

config({ path: '.env.local', quiet: true })

async function main() {
  try {
    assertDevelopmentConnection(
      process.env.DATABASE_URL,
      process.env.DATABASE_URL_DIRECT,
      process.env.NEON_DEVELOPMENT_ENDPOINT_ID,
    )
  } catch {
    console.error(
      'Database check blocked: verify and set the development endpoint ID in Neon.',
    )
    process.exitCode = 1
    return
  }

  // Import after loading .env.local so the client validates the endpoint first.
  const { db } = await import('../src/db')
  const { sql } = await import('drizzle-orm')
  const result = await db.execute(sql`SELECT 1 AS ok`)

  if (result.rows[0]?.ok !== 1) {
    throw new Error('Unexpected database response.')
  }

  console.log('Development database connection OK.')
}

main().catch(() => {
  // Driver errors may include connection details; never print the original error.
  console.error(
    'Database check failed. Verify the development endpoint and connection.',
  )
  process.exitCode = 1
})
