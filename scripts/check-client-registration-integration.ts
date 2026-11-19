import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { config } from 'dotenv'
import postgres from 'postgres'
import { assertDevelopmentConnection } from '../src/db/development-branch'

config({ path: '.env.local', quiet: true })

const label = randomUUID()
const emails = [
  `archimart-client-check-${label}@example.com`,
  `archimart-recovery-check-${label}@example.com`,
]
const password = randomBytes(32).toString('base64url')

async function main() {
  if (!process.argv.includes('--run-disposable-registration-check')) {
    throw new Error('Explicit disposable-check flag required')
  }
  assertDevelopmentConnection(
    process.env.DATABASE_URL,
    process.env.DATABASE_URL_DIRECT,
    process.env.NEON_DEVELOPMENT_ENDPOINT_ID,
  )
  assert.notEqual(process.env.MARKETPLACE_CLIENT_REGISTRATION_ENABLED, 'true')
  assert.equal(process.env.VERCEL_ENV, undefined)
  Object.assign(process.env, { NODE_ENV: 'development' })
  const sql = postgres(process.env.DATABASE_URL_DIRECT!, {
    max: 5,
    prepare: false,
  })
  try {
    const migrations =
      await sql`SELECT hash FROM drizzle.__drizzle_migrations ORDER BY id`
    assert.equal(migrations.length, 4)
    const [existing] = await sql<{ count: number }[]>`
      SELECT count(*)::int AS count FROM auth."user" WHERE email IN ${sql(emails)}
    `
    assert.equal(existing.count, 0)
    console.log(
      'Disposable fixtures planned: two unique auth identities, two credential rows, two client rows; no email will be sent. Fixture labels:',
    )
    emails.forEach((email) => console.log(email))

    // The override exists only in this process. No HTTP registration handler is mounted.
    process.env.MARKETPLACE_CLIENT_REGISTRATION_ENABLED = 'true'
    const { prepareClientRegistrationDevelopmentCheck } =
      await import('../src/lib/client-registration-server')
    const { prepareClientAccountCreation } =
      await import('../src/lib/client-account-creation')
    const { createClientAccountCreationBoundary } =
      await import('../src/lib/client-account-creation-boundary')
    const { authorizeClientAccount, MarketplaceAccountAccessError } =
      await import('../src/lib/marketplace-account-authorization')
    const { auth } = await import('../src/lib/auth')

    assert.equal(auth.options.emailAndPassword?.disableSignUp, true)
    assert.ok(auth.options.disabledPaths?.includes('/sign-up/email'))
    const direct = await auth.handler(
      new Request('http://localhost:3000/api/auth/sign-up/email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      }),
    )
    assert.equal(direct.status, 404)

    const register = prepareClientRegistrationDevelopmentCheck()
    const first = {
      email: emails[0],
      name: 'Disposable Client Check',
      password,
    }
    await register(first)
    await register(first)
    const firstRows = await sql<
      {
        subject: string
        verified: boolean
        account_id: string
        role: string
        status: string
        admin_count: number
        credential_count: number
      }[]
    >`
      SELECT u.id AS subject, u.email_verified AS verified,
             m.id AS account_id, m.role::text AS role, m.status::text AS status,
             (SELECT count(*)::int FROM admins WHERE auth_subject = u.id) AS admin_count,
             (SELECT count(*)::int FROM auth.account WHERE user_id = u.id AND provider_id = 'credential') AS credential_count
      FROM auth."user" u JOIN marketplace_accounts m ON m.auth_subject = u.id
      WHERE u.email = ${first.email}
    `
    assert.equal(firstRows.length, 1)
    assert.equal(firstRows[0].role, 'client')
    assert.equal(firstRows[0].status, 'active')
    assert.equal(firstRows[0].verified, false)
    assert.equal(firstRows[0].admin_count, 0)
    assert.equal(firstRows[0].credential_count, 1)
    console.log(
      `Created client fixture: auth subject ${firstRows[0].subject}; marketplace account ${firstRows[0].account_id}`,
    )

    // A real transaction holds the auth identity lock while another connection
    // tries the production account boundary. It must wait for lock release.
    let locked!: () => void
    const lockReady = new Promise<void>((resolve) => {
      locked = resolve
    })
    let unlock!: () => void
    const unlockSignal = new Promise<void>((resolve) => {
      unlock = resolve
    })
    const holder = sql.begin(async (tx) => {
      await tx`SELECT id FROM auth."user" WHERE id = ${firstRows[0].subject} FOR UPDATE`
      locked()
      await unlockSignal
    })
    await lockReady
    let finished = false
    const competing = prepareClientAccountCreation(async () => ({
      subject: firstRows[0].subject,
    }))().then((id) => {
      finished = true
      return id
    })
    await new Promise((resolve) => setTimeout(resolve, 200))
    assert.equal(finished, false)
    unlock()
    await holder
    assert.equal(await competing, firstRows[0].account_id)
    console.log(
      'PostgreSQL identity row lock serialized a competing account operation.',
    )

    const second = {
      email: emails[1],
      name: 'Disposable Recovery Check',
      password,
    }
    const recover = prepareClientRegistrationDevelopmentCheck(true)
    await recover(second)
    const [partial] = await sql<
      {
        subject: string
        verified: boolean
        account_count: number
        marker_count: number
      }[]
    >`
      SELECT u.id AS subject, u.email_verified AS verified,
             (SELECT count(*)::int FROM marketplace_accounts WHERE auth_subject = u.id) AS account_count,
             (SELECT count(*)::int FROM auth.verification WHERE identifier = 'client-registration:' || u.id) AS marker_count
      FROM auth."user" u WHERE u.email = ${second.email}
    `
    assert.ok(partial?.subject)
    assert.equal(partial.verified, false)
    assert.equal(partial.account_count, 0)
    assert.equal(partial.marker_count, 1)
    await assert.rejects(
      authorizeClientAccount(
        { id: partial.subject, emailVerified: false },
        async () => undefined,
      ),
      MarketplaceAccountAccessError,
    )
    await recover({ ...second, password: 'incorrect-password' })
    const [afterWrongPassword] = await sql<{ count: number }[]>`
      SELECT count(*)::int AS count FROM marketplace_accounts WHERE auth_subject = ${partial.subject}
    `
    assert.equal(afterWrongPassword.count, 0)

    // Insert an inactive admin only inside a rolled-back transaction. The
    // boundary must reject it before considering a client row.
    const rollback = Symbol('rollback')
    try {
      await sql.begin(async (tx) => {
        await tx`
          INSERT INTO admins (auth_subject, email, name, is_active)
          VALUES (${partial.subject}, ${second.email}, 'Disposable Admin Fixture', false)
        `
        const boundary = createClientAccountCreationBoundary({
          getAuthorizedIdentity: async () => ({ subject: partial.subject }),
          withLockedIdentity: async (_subject, operation) => {
            const rows =
              await tx`SELECT id FROM auth."user" WHERE id = ${partial.subject} FOR UPDATE`
            return operation({
              exists: rows.length === 1,
              hasAdministratorRecord: async () => {
                const rows =
                  await tx`SELECT id FROM admins WHERE auth_subject = ${partial.subject} LIMIT 1`
                return rows.length > 0
              },
              findMarketplaceAccount: async () => null,
              insertClientAccount: async () => {
                throw new Error('Unexpected client insert')
              },
            })
          },
        })
        await assert.rejects(boundary())
        throw rollback
      })
    } catch (error) {
      if (error !== rollback) throw error
    }
    const [adminAfterRollback] = await sql<{ count: number }[]>`
      SELECT count(*)::int AS count FROM admins WHERE auth_subject = ${partial.subject}
    `
    assert.equal(adminAfterRollback.count, 0)
    console.log(
      'Inactive administrator overlap was rejected inside a rolled-back PostgreSQL fixture.',
    )

    await Promise.all([recover(second), recover(second)])
    const recovered = await sql<
      {
        account_id: string
        role: string
        status: string
        marker_count: number
        admin_count: number
      }[]
    >`
      SELECT m.id AS account_id, m.role::text AS role, m.status::text AS status,
             (SELECT count(*)::int FROM auth.verification WHERE identifier = 'client-registration:' || m.auth_subject) AS marker_count,
             (SELECT count(*)::int FROM admins WHERE auth_subject = m.auth_subject) AS admin_count
      FROM marketplace_accounts m WHERE m.auth_subject = ${partial.subject}
    `
    assert.equal(recovered.length, 1)
    assert.equal(recovered[0].role, 'client')
    assert.equal(recovered[0].status, 'active')
    assert.equal(recovered[0].marker_count, 0)
    assert.equal(recovered[0].admin_count, 0)
    console.log(
      `Recovered client fixture: auth subject ${partial.subject}; marketplace account ${recovered[0].account_id}`,
    )

    await assert.rejects(
      authorizeClientAccount(
        { id: partial.subject, emailVerified: false },
        async () => ({
          authSubject: partial.subject,
          role: 'client',
          status: 'active',
          approvalStatus: null,
        }),
      ),
      MarketplaceAccountAccessError,
    )
    console.log(
      'Unverified identity remains denied; public sign-up and administrator session rules remain unchanged.',
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
      'Development integration check failed. Inspect disposable fixture labels before any retry; no automatic cleanup ran.',
    )
    process.exit(1)
  },
)
