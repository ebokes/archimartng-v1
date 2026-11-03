import 'server-only'

import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth/minimal'
import { and, eq } from 'drizzle-orm'
import { authDb } from '@/db/auth-client'
import { account, session, user, verification } from '@/db/auth-schema'
import { db } from '@/db'
import { admins } from '@/db/schema'

const secret = process.env.BETTER_AUTH_SECRET
const baseURL = process.env.BETTER_AUTH_URL

if (!secret || secret.length < 32) {
  throw new Error('BETTER_AUTH_SECRET must contain at least 32 characters.')
}

if (!baseURL) {
  throw new Error('BETTER_AUTH_URL is required.')
}

let authUrl: URL
try {
  authUrl = new URL(baseURL)
} catch {
  throw new Error('BETTER_AUTH_URL is invalid.')
}

if (!['http:', 'https:'].includes(authUrl.protocol)) {
  throw new Error('BETTER_AUTH_URL must be an HTTP or HTTPS URL.')
}

export const auth = betterAuth({
  secret,
  baseURL,
  database: drizzleAdapter(authDb, {
    provider: 'pg',
    schemaName: 'auth',
    schema: { user, session, account, verification },
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    autoSignIn: false,
  },
  disabledPaths: ['/sign-up/email'],
  session: {
    cookieCache: { enabled: false },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (newSession) => {
          const [admin] = await db
            .select({ id: admins.id })
            .from(admins)
            .where(
              and(
                eq(admins.authSubject, newSession.userId),
                eq(admins.isActive, true),
              ),
            )
            .limit(1)

          if (!admin) return false
        },
      },
    },
  },
})
