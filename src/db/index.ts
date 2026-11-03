import 'server-only'

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { assertDevelopmentConnection } from './development-branch'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required.')
}

if (process.env.NODE_ENV !== 'production') {
  assertDevelopmentConnection(
    databaseUrl,
    process.env.DATABASE_URL_DIRECT,
    process.env.NEON_DEVELOPMENT_ENDPOINT_ID,
  )
}

export const db = drizzle(neon(databaseUrl))
