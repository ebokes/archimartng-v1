import { Writable } from 'node:stream'
import { createInterface } from 'node:readline/promises'
import { config } from 'dotenv'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth/minimal'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { account, session, user, verification } from '../src/db/auth-schema'
import { assertDevelopmentConnection } from '../src/db/development-branch'

function parseIdentity(args: string[]) {
  if (args.length === 1 && args[0] === '--help') {
    console.log(
      'Usage: npm run admin:provision:first -- --email ADDRESS --name "Full Name"',
    )
    process.exit(0)
  }

  if (args.length !== 4 || args[0] !== '--email' || args[2] !== '--name') {
    throw new Error('Expected --email ADDRESS --name "Full Name".')
  }

  const email = args[1].trim().toLowerCase()
  const name = args[3].trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name) {
    throw new Error('A valid email and nonempty name are required.')
  }

  return { email, name }
}

async function readPassword() {
  if (!process.stdin.isTTY) {
    throw new Error('Run this command in an interactive terminal.')
  }

  // Readline's terminal echo goes to this sink; the password never reaches stdout.
  const output = new Writable({
    write(_chunk, _encoding, callback) {
      callback()
    },
  })
  const reader = createInterface({
    input: process.stdin,
    output,
    terminal: true,
  })
  process.stderr.write('New administrator password: ')
  try {
    return await reader.question('')
  } finally {
    reader.close()
    process.stderr.write('\n')
  }
}

async function main() {
  const { email, name } = parseIdentity(process.argv.slice(2))
  config({ path: '.env.local', quiet: true })

  const pooledUrl = process.env.DATABASE_URL
  const directUrl = process.env.DATABASE_URL_DIRECT
  assertDevelopmentConnection(
    pooledUrl,
    directUrl,
    process.env.NEON_DEVELOPMENT_ENDPOINT_ID,
  )

  const secret = process.env.BETTER_AUTH_SECRET
  const baseURL = process.env.BETTER_AUTH_URL
  if (!secret || secret.length < 32 || !baseURL) {
    throw new Error('Better Auth environment configuration is incomplete.')
  }
  try {
    const url = new URL(baseURL)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error()
  } catch {
    throw new Error('BETTER_AUTH_URL must be a valid HTTP or HTTPS URL.')
  }
  if (!process.stdin.isTTY) {
    throw new Error('Run this command in an interactive terminal.')
  }

  // Use the guarded direct development endpoint for both Better Auth and the
  // application allow-list. This instance is never mounted as a route handler.
  const client = postgres(directUrl!, { max: 1, prepare: false })
  let identityCreated = false
  try {
    const [counts] = await client`
      SELECT
        (SELECT count(*)::int FROM auth."user") AS users,
        (SELECT count(*)::int FROM public.admins) AS admins
    `
    if (counts.users !== 0 || counts.admins !== 0) {
      throw new Error(
        'First-admin provisioning requires empty auth user and admin tables. Review existing records manually.',
      )
    }

    const password = await readPassword()
    if (password.length < 12 || password.length > 128) {
      throw new Error('Password must contain 12 to 128 characters.')
    }

    const provisioningAuth = betterAuth({
      secret,
      baseURL,
      logger: { disabled: true },
      database: drizzleAdapter(drizzle(client), {
        provider: 'pg',
        schemaName: 'auth',
        schema: { user, session, account, verification },
      }),
      emailAndPassword: {
        enabled: true,
        disableSignUp: false,
        autoSignIn: false,
        minPasswordLength: 12,
      },
    })

    const result = await provisioningAuth.api.signUpEmail({
      body: { email, name, password },
    })
    if (!result.user?.id || result.token !== null) {
      throw new Error(
        'Better Auth did not return the expected user without a session.',
      )
    }
    identityCreated = true

    await client`
      INSERT INTO public.admins (auth_subject, email, name, is_active)
      VALUES (${result.user.id}, ${email}, ${name}, true)
    `

    const [confirmed] = await client`
      SELECT EXISTS (
        SELECT 1 FROM public.admins
        WHERE auth_subject = ${result.user.id} AND is_active = true
      ) AS active
    `
    if (!confirmed.active)
      throw new Error('Admin allow-list verification failed.')
    console.log('First administrator provisioned on the development branch.')
  } catch {
    if (identityCreated) {
      console.error(
        'Provisioning stopped after creating the auth identity. Review the development records manually before retrying.',
      )
    } else {
      console.error(
        'First-administrator provisioning failed without granting access.',
      )
    }
    process.exitCode = 1
  } finally {
    await client.end()
  }
}

main().catch(() => {
  // Driver and Better Auth errors can contain connection or identity details.
  console.error(
    'First-administrator provisioning was blocked before any account was created.',
  )
  process.exitCode = 1
})
