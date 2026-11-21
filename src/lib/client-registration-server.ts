import 'server-only'

import { randomUUID } from 'node:crypto'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth/minimal'
import { verifyPassword } from 'better-auth/crypto'
import { and, eq, gt } from 'drizzle-orm'
import { authDb } from '@/db/auth-client'
import { account, session, user, verification } from '@/db/auth-schema'
import { isLocalClientRegistrationAvailable } from './client-registration-gate'
import { auth } from './auth'
import { prepareClientAccountCreation } from './client-account-creation'
import {
  createClientRegistration,
  type ClientRegistrationDependencies,
} from './client-registration'

const markerPrefix = 'client-registration:'

// This private Better Auth instance is never mounted as an HTTP handler. The
// public instance in auth.ts keeps email/password sign-up disabled.
async function createIdentity(input: {
  email: string
  name: string
  password: string
}): Promise<{ kind: 'created'; subject: string } | { kind: 'existing' }> {
  let createdSubject: string | null = null
  const privateAuth = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    logger: { disabled: true },
    database: drizzleAdapter(authDb, {
      provider: 'pg',
      schemaName: 'auth',
      schema: { user, session, account, verification },
    }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: false,
      autoSignIn: false,
      minPasswordLength: 12,
      maxPasswordLength: 128,
    },
    databaseHooks: {
      user: {
        create: {
          after: async (created) => {
            createdSubject = created.id
          },
        },
      },
    },
  })
  await privateAuth.api.signUpEmail({ body: input })
  // Better Auth returns a synthetic user ID for an existing email when
  // autoSignIn is false. Trust only the create hook, never the response ID.
  return createdSubject
    ? { kind: 'created', subject: createdSubject }
    : { kind: 'existing' }
}

async function recoverIdentity(email: string, password: string) {
  const [candidate] = await authDb
    .select({ subject: user.id, passwordHash: account.password })
    .from(user)
    .innerJoin(
      account,
      and(
        eq(account.userId, user.id),
        eq(account.providerId, 'credential'),
        eq(account.accountId, user.id),
      ),
    )
    .where(eq(user.email, email))
    .limit(1)
  if (!candidate?.passwordHash) return null
  const [marker] = await authDb
    .select({ id: verification.id })
    .from(verification)
    .where(
      and(
        eq(verification.identifier, `${markerPrefix}${candidate.subject}`),
        eq(verification.value, 'pending'),
        gt(verification.expiresAt, new Date()),
      ),
    )
    .limit(1)
  if (!marker) return null
  try {
    return (await verifyPassword({ hash: candidate.passwordHash, password }))
      ? candidate.subject
      : null
  } catch {
    return null
  }
}

function registrationDependencies(): ClientRegistrationDependencies {
  return {
    enabled: () => isLocalClientRegistrationAvailable(),
    createIdentity,
    async markRecoverable(subject) {
      await authDb.insert(verification).values({
        id: randomUUID(),
        identifier: `${markerPrefix}${subject}`,
        value: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
    },
    recoverIdentity,
    createClientAccount: async (subject) =>
      prepareClientAccountCreation(async () => ({ subject }))(),
    async clearRecoveryMarker(subject) {
      await authDb
        .delete(verification)
        .where(eq(verification.identifier, `${markerPrefix}${subject}`))
    },
    async sendVerification(email) {
      await auth.api.sendVerificationEmail({
        body: { email, callbackURL: '/' },
      })
    },
  }
}

const register = createClientRegistration(registrationDependencies())

// Kept out of the HTTP route graph. This creates real development records but
// suppresses email and can inject one account-write failure for integration tests.
export function prepareClientRegistrationDevelopmentCheck(
  failAccountOnce = false,
) {
  if (
    process.env.NODE_ENV !== 'development' ||
    process.env.VERCEL_ENV ||
    !isLocalClientRegistrationAvailable()
  ) {
    throw new Error('Development registration check unavailable')
  }
  const dependencies = registrationDependencies()
  let fail = failAccountOnce
  return createClientRegistration({
    ...dependencies,
    async createClientAccount(subject) {
      if (fail) {
        fail = false
        throw new Error('Injected account-write failure')
      }
      return dependencies.createClientAccount(subject)
    },
    sendVerification: async () => {},
  })
}

// Only a future reviewed server-side registration action may call this.
export const registerClientInTrustedFlow = register
