import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
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
  for (const name of [
    'ACCOUNT_RATE_LIMIT_ENABLED',
    'MARKETPLACE_CLIENT_REGISTRATION_ENABLED',
    'MARKETPLACE_CLIENT_SESSION_ENABLED',
  ]) {
    if (process.env[name] === 'true')
      throw new Error('A V2 feature gate is enabled.')
  }

  const migration = readFileSync('drizzle/0004_legal_mole_man.sql', 'utf8')
  const statements = migration
    .split('--> statement-breakpoint')
    .map((s) => s.trim())
  if (
    statements.length !== 2 ||
    !/^CREATE TABLE "account_rate_limits" \(/.test(statements[0]) ||
    !statements[0].includes(
      'CONSTRAINT "account_rate_limits_attempts_positive" CHECK',
    ) ||
    !/^CREATE INDEX "account_rate_limits_expires_at_idx" ON "account_rate_limits"/.test(
      statements[1],
    ) ||
    /\b(?:ALTER|DROP|TRUNCATE|DELETE|UPDATE|INSERT)\b/i.test(migration)
  )
    throw new Error('Migration SQL differs from the reviewed additive shape.')

  const post = process.argv.includes('--post')
  const sql = postgres(process.env.DATABASE_URL_DIRECT!, {
    max: 1,
    prepare: false,
  })
  try {
    const files = [
      'drizzle/0000_round_maestro.sql',
      'drizzle/0001_empty_energizer.sql',
      'drizzle/0002_orange_demogoblin.sql',
      'drizzle/0003_v2_marketplace_accounts.sql',
      'drizzle/0004_legal_mole_man.sql',
    ]
    const expected = files.map((file) =>
      createHash('sha256').update(readFileSync(file)).digest('hex'),
    )
    const history = await sql<{ hash: string }[]>`
      SELECT hash FROM drizzle.__drizzle_migrations ORDER BY id
    `
    const count = post ? 5 : 4
    if (
      history.length !== count ||
      history.some((row, i) => row.hash !== expected[i])
    ) {
      throw new Error('Migration history differs from reviewed files.')
    }

    const [objects] = await sql<
      {
        app_tables: number
        auth_tables: number
        v2_tables: number
        v2_enums: number
        rate_table: number
      }[]
    >`
      SELECT
        (SELECT count(*)::int FROM information_schema.tables WHERE table_schema = 'public'
          AND table_name IN ('admins', 'plans', 'plan_images', 'professionals',
            'professional_applications', 'enquiries', 'enquiry_notes')) AS app_tables,
        (SELECT count(*)::int FROM information_schema.tables WHERE table_schema = 'auth'
          AND table_name IN ('user', 'account', 'session', 'verification')) AS auth_tables,
        (SELECT count(*)::int FROM information_schema.tables WHERE table_schema = 'public'
          AND table_name IN ('marketplace_accounts', 'professional_accounts',
            'professional_account_events')) AS v2_tables,
        (SELECT count(*)::int FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE n.nspname = 'public' AND t.typname IN ('marketplace_role',
            'marketplace_account_status', 'professional_approval_status',
            'professional_account_event_type')) AS v2_enums,
        (SELECT count(*)::int FROM information_schema.tables WHERE table_schema = 'public'
          AND table_name = 'account_rate_limits') AS rate_table
    `
    if (
      objects?.app_tables !== 7 ||
      objects.auth_tables !== 4 ||
      objects.v2_tables !== 3 ||
      objects.v2_enums !== 4 ||
      objects.rate_table !== (post ? 1 : 0)
    )
      throw new Error('Database schema differs from expected preflight state.')

    if (post) {
      const columns = await sql<
        { column_name: string; data_type: string; is_nullable: string }[]
      >`
        SELECT column_name, data_type, is_nullable FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'account_rate_limits'
        ORDER BY ordinal_position
      `
      const expectedColumns = [
        ['key_hash', 'text'],
        ['attempts', 'integer'],
        ['window_started_at', 'timestamp with time zone'],
        ['expires_at', 'timestamp with time zone'],
      ]
      if (
        columns.length !== 4 ||
        columns.some(
          (col, i) =>
            col.column_name !== expectedColumns[i][0] ||
            col.data_type !== expectedColumns[i][1] ||
            col.is_nullable !== 'NO',
        )
      )
        throw new Error('Counter columns differ from migration.')
      const [constraints] = await sql<
        { pk: number; positive: number; expiry_index: number }[]
      >`
        SELECT
          (SELECT count(*)::int FROM pg_constraint WHERE conrelid = 'public.account_rate_limits'::regclass AND contype = 'p') AS pk,
          (SELECT count(*)::int FROM pg_constraint WHERE conrelid = 'public.account_rate_limits'::regclass AND conname = 'account_rate_limits_attempts_positive' AND contype = 'c') AS positive,
          (SELECT count(*)::int FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'account_rate_limits' AND indexname = 'account_rate_limits_expires_at_idx' AND indexdef LIKE '%(expires_at)%') AS expiry_index
      `
      if (
        constraints?.pk !== 1 ||
        constraints.positive !== 1 ||
        constraints.expiry_index !== 1
      )
        throw new Error('Counter constraints or expiry index missing.')
      const [counter] = await sql<{ count: number; malformed_keys: number }[]>`
        SELECT count(*)::int AS count,
          count(*) FILTER (WHERE key_hash !~ '^[a-f0-9]{64}$')::int AS malformed_keys
        FROM public.account_rate_limits
      `
      if (counter.malformed_keys !== 0)
        throw new Error('A counter key is not a 64-character hash.')
      console.log(`Development counter rows present: ${counter.count}.`)
    }
    console.log(
      post
        ? 'Postflight passed: migration 0004, counter schema, V1/auth/V2 objects, and disabled gates verified.'
        : 'Preflight passed: development endpoint, migrations 0000–0003, no 0004, prior schema, additive SQL, and disabled gates verified.',
    )
  } finally {
    await sql.end()
  }
}

main().catch(() => {
  console.error(
    'Rate-limit migration verification failed; inspect privately before proceeding.',
  )
  process.exitCode = 1
})
