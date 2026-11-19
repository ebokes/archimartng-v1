import assert from 'node:assert/strict'
import { createHash, randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { config } from 'dotenv'
import postgres from 'postgres'
import { assertDevelopmentConnection } from '../src/db/development-branch'
import { readAuthEmailConfig } from '../src/lib/auth-email'

config({ path: '.env.local', quiet: true })

type Mode = 'prepare' | 'send' | 'check'

async function main() {
  const mode = process.argv[2] as Mode
  const recipient = process.argv[3]
  if (!['prepare', 'send', 'check'].includes(mode) || !recipient) {
    throw new Error('Expected prepare, send, or check with a recipient address')
  }
  if (process.env.VERCEL_ENV || process.env.NODE_ENV === 'production') {
    throw new Error('Development-only check')
  }
  assertDevelopmentConnection(
    process.env.DATABASE_URL,
    process.env.DATABASE_URL_DIRECT,
    process.env.NEON_DEVELOPMENT_ENDPOINT_ID,
  )
  const mail = readAuthEmailConfig(process.env)
  if (
    !mail ||
    mail.environment !== 'development' ||
    mail.origin !== process.env.BETTER_AUTH_URL ||
    !['localhost', '127.0.0.1'].includes(new URL(mail.origin).hostname)
  ) {
    throw new Error('Local development email origin is not ready')
  }
  if (process.env.MARKETPLACE_CLIENT_REGISTRATION_ENABLED === 'true') {
    throw new Error('Public registration gate must remain disabled')
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    throw new Error('Recipient format invalid')
  }

  const sql = postgres(process.env.DATABASE_URL_DIRECT!, {
    max: 2,
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
    assert.equal(rows.length, expected.length)
    assert.ok(rows.every((row, index) => row.hash === expected[index]))

    const [identity] = await sql<
      {
        subject: string
        verified: boolean
        account_id: string | null
        role: string | null
        status: string | null
        admin_count: number
        session_count: number
      }[]
    >`
      SELECT u.id AS subject, u.email_verified AS verified,
             m.id AS account_id, m.role::text AS role, m.status::text AS status,
             (SELECT count(*)::int FROM admins WHERE auth_subject = u.id) AS admin_count,
             (SELECT count(*)::int FROM auth.session WHERE user_id = u.id) AS session_count
      FROM auth."user" u LEFT JOIN marketplace_accounts m ON m.auth_subject = u.id
      WHERE lower(u.email) = lower(${recipient}) LIMIT 1
    `

    if (mode === 'prepare') {
      console.log(
        'Development endpoint, migration history, disabled registration, and trusted local mail origin: verified.',
      )
      console.log(
        `Recipient available for a new disposable identity: ${!identity}`,
      )
      console.log(
        'Existing synthetic-address fixtures cannot receive this message.',
      )
      return
    }

    if (mode === 'send') {
      if (identity)
        throw new Error('Recipient already has a Better Auth identity')
      Object.assign(process.env, {
        NODE_ENV: 'development',
        MARKETPLACE_CLIENT_REGISTRATION_ENABLED: 'true',
      })
      const { prepareClientRegistrationDevelopmentCheck } =
        await import('../src/lib/client-registration-server')
      // Registration creates a Better Auth identity and client row, but this
      // development helper suppresses its automatic verification callback.
      const register = prepareClientRegistrationDevelopmentCheck()
      await register({
        email: recipient,
        name: 'Archimart Verification Check',
        password: randomBytes(32).toString('base64url'),
      })
      process.env.MARKETPLACE_CLIENT_REGISTRATION_ENABLED = 'false'
      const [created] = await sql<
        {
          subject: string
          verified: boolean
          account_id: string
          role: string
          status: string
          admin_count: number
          session_count: number
        }[]
      >`
        SELECT u.id AS subject, u.email_verified AS verified,
               m.id AS account_id, m.role::text AS role, m.status::text AS status,
               (SELECT count(*)::int FROM admins WHERE auth_subject = u.id) AS admin_count,
               (SELECT count(*)::int FROM auth.session WHERE user_id = u.id) AS session_count
        FROM auth."user" u JOIN marketplace_accounts m ON m.auth_subject = u.id
        WHERE lower(u.email) = lower(${recipient})
      `
      assert.ok(created)
      assert.equal(created.verified, false)
      assert.equal(created.role, 'client')
      assert.equal(created.status, 'active')
      assert.equal(created.admin_count, 0)
      assert.equal(created.session_count, 0)
      console.log(
        `Disposable identity created: auth subject ${created.subject}; marketplace account ${created.account_id}.`,
      )

      const { auth } = await import('../src/lib/auth')
      assert.equal(auth.options.emailAndPassword?.disableSignUp, true)
      assert.ok(auth.options.disabledPaths?.includes('/sign-up/email'))
      assert.equal(
        Boolean(auth.options.emailVerification?.sendVerificationEmail),
        true,
      )
      await auth.api.sendVerificationEmail({
        body: { email: recipient, callbackURL: '/' },
      })
      console.log(
        'Better Auth verification send accepted; inspect the controlled inbox. No token or link was logged.',
      )
      return
    }

    if (!identity) throw new Error('Disposable identity not found')
    assert.equal(identity.role, 'client')
    assert.equal(identity.status, 'active')
    assert.equal(identity.admin_count, 0)
    console.log(
      `Disposable identity: auth subject ${identity.subject}; marketplace account ${identity.account_id}.`,
    )
    console.log(
      `Email verified: ${identity.verified}; administrator memberships: ${identity.admin_count}; sessions: ${identity.session_count}.`,
    )
  } finally {
    process.env.MARKETPLACE_CLIENT_REGISTRATION_ENABLED = 'false'
    await sql.end()
  }
}

main().then(
  () => process.exit(0),
  () => {
    console.error(
      'Development verification check failed. No credentials, tokens, or provider details are displayed.',
    )
    process.exit(1)
  },
)
