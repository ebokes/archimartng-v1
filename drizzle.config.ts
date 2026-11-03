import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'
import { assertDevelopmentConnection } from './src/db/development-branch'

config({ path: '.env.local', quiet: true })

assertDevelopmentConnection(
  process.env.DATABASE_URL,
  process.env.DATABASE_URL_DIRECT,
  process.env.NEON_DEVELOPMENT_ENDPOINT_ID,
)

export default defineConfig({
  schema: ['./src/db/schema.ts', './src/db/auth-schema.ts'],
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL_DIRECT! },
})
