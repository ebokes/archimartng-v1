import 'server-only'

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { assertDevelopmentConnection } from './development-branch'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for authentication.')
}

if (process.env.NODE_ENV !== 'production') {
  assertDevelopmentConnection(
    databaseUrl,
    process.env.DATABASE_URL_DIRECT,
    process.env.NEON_DEVELOPMENT_ENDPOINT_ID,
  )
}

// Better Auth needs a connection that supports interactive transactions.
const client = postgres(databaseUrl, { max: 5, prepare: false })

export const authDb = drizzle(client)
