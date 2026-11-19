import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { config } from 'dotenv'
import postgres from 'postgres'
import { assertDevelopmentConnection } from '../src/db/development-branch'

config({ path: '.env.local', quiet: true })

async function main() {
  assertDevelopmentConnection(
    process.env.DATABASE_URL,
    process.env.DATABASE_URL_DIRECT,
    process.env.NEON_DEVELOPMENT_ENDPOINT_ID,
  )
  if (process.env.MARKETPLACE_CLIENT_REGISTRATION_ENABLED === 'true') {
    throw new Error('Public registration gate must remain disabled.')
  }
  const sql = postgres(process.env.DATABASE_URL_DIRECT!, {
    max: 1,
    prepare: false,
  })
  try {
    const rows = await sql<{ hash: string }[]>`
      SELECT hash FROM drizzle.__drizzle_migrations ORDER BY id
    `
    const files = [
      'drizzle/0000_round_maestro.sql',
      'drizzle/0001_empty_energizer.sql',
      'drizzle/0002_orange_demogoblin.sql',
      'drizzle/0003_v2_marketplace_accounts.sql',
    ]
    const expected = files.map((file) =>
      createHash('sha256').update(readFileSync(file)).digest('hex'),
    )
    if (
      rows.length !== expected.length ||
      rows.some((row, index) => row.hash !== expected[index])
    ) {
      throw new Error('Migration history differs from reviewed files.')
    }
    const [schema] = await sql<
      {
        tables: number
        enums: number
        account_columns: number
      }[]
    >`
      SELECT
        (SELECT count(*)::int FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name IN
           ('admins', 'marketplace_accounts', 'professional_accounts', 'professional_account_events')) AS tables,
        (SELECT count(*)::int FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
         WHERE n.nspname = 'public' AND t.typname IN
           ('marketplace_role', 'marketplace_account_status', 'professional_approval_status', 'professional_account_event_type')) AS enums,
        (SELECT count(*)::int FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'marketplace_accounts'
           AND column_name IN ('id', 'auth_subject', 'role', 'status')) AS account_columns
    `
    const [authTables] = await sql<{ count: number }[]>`
      SELECT count(*)::int AS count FROM information_schema.tables
      WHERE table_schema = 'auth' AND table_name IN ('user', 'account', 'session', 'verification')
    `
    if (
      schema?.tables !== 4 ||
      schema.enums !== 4 ||
      schema.account_columns !== 4 ||
      authTables?.count !== 4
    ) {
      throw new Error(
        'Expected application or authentication schema is missing.',
      )
    }
    console.log(
      'Verified development endpoint guard, migrations 0000–0003, account and auth tables, and disabled registration gate.',
    )
  } finally {
    await sql.end()
  }
}

main().catch(() => {
  console.error(
    'Registration preflight failed; no integration write was attempted.',
  )
  process.exitCode = 1
})
