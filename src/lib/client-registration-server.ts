import 'server-only'

import { randomUUID } from 'node:crypto'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth/minimal'
import { verifyPassword } from 'better-auth/crypto'
import { and, eq, gt } from 'drizzle-orm'
import { authDb } from '@/db/auth-client'
import { account, session, user, verification } from '@/db/auth-schema'
import { readAuthEmailConfig } from './auth-email'
import { auth } from './auth'
import { prepareClientAccountCreation } from './client-account-creation'
import {
  createClientRegistration,
  isClientRegistrationEnabled,
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

const register = createClientRegistration({
  enabled: () =>
    isClientRegistrationEnabled(
      process.env,
      readAuthEmailConfig(process.env)?.environment === 'development',
    ),
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
    await auth.api.sendVerificationEmail({ body: { email, callbackURL: '/' } })
  },
})

// Only a future reviewed server-side registration action may call this.
export const registerClientInTrustedFlow = register
