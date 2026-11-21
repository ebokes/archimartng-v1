import 'server-only'

import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth/minimal'
import { eq } from 'drizzle-orm'
import { authDb } from '@/db/auth-client'
import { account, session, user, verification } from '@/db/auth-schema'
import { db } from '@/db'
import { admins, marketplaceAccounts, professionalAccounts } from '@/db/schema'
import { createAuthEmailDelivery, readAuthEmailConfig } from './auth-email'
import {
  createSessionAdmissionGate,
  isClientSessionAdmissionEnabled,
  isLegacyAdminSessionLookup,
} from './client-session-admission'
import { hasMarketplaceMembership } from './marketplace-membership'
import {
  betterAuthRateLimitStorage,
  isAccountRateLimitReady,
} from './account-rate-limit-store'

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

const emailConfig = readAuthEmailConfig(process.env)
const deliverAuthEmail = createAuthEmailDelivery(emailConfig)

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
    ...(emailConfig && {
      sendResetPassword: async ({ user, url, token }) =>
        deliverAuthEmail('password-reset', user.email, url, token),
    }),
  },
  ...(emailConfig && {
    emailVerification: {
      sendVerificationEmail: async ({
        user,
        url,
        token,
      }: {
        user: { email: string }
        url: string
        token: string
      }) => deliverAuthEmail('verification', user.email, url, token),
    },
  }),
  disabledPaths: ['/sign-up/email'],
  ...(isAccountRateLimitReady() && {
    advanced: {
      ipAddress: {
        // Local requests share one bucket; ignore client-supplied forwarding
        // headers. Vercel supplies its own forwarded address at the edge.
        ipAddressHeaders: process.env.VERCEL_ENV
          ? ['x-vercel-forwarded-for']
          : [],
      },
    },
    rateLimit: {
      enabled: true,
      customStorage: betterAuthRateLimitStorage(),
      customRules: {
        '/sign-in/email': { window: 900, max: 5 },
        '/send-verification-email': { window: 3600, max: 10 },
        '/request-password-reset': { window: 3600, max: 10 },
        '/reset-password': { window: 900, max: 10 },
        '/verify-email': { window: 900, max: 20 },
      },
    },
  }),
  session: {
    cookieCache: { enabled: false },
  },
  databaseHooks: {
    session: {
      create: {
        before: createSessionAdmissionGate({
          clientEnabled: () => isClientSessionAdmissionEnabled(process.env),
          async findState(subject) {
            // Production account-schema state is unverified. Keep V1 admin
            // admission independent of the new table, while rejecting overlap
            // if that table is present. No client admission is allowed here.
            if (isLegacyAdminSessionLookup(process.env)) {
              const [admin] = await db
                .select({ isActive: admins.isActive })
                .from(admins)
                .where(eq(admins.authSubject, subject))
                .limit(1)
              if (!admin) return undefined
              if (!admin.isActive)
                return {
                  emailVerified: false,
                  administratorIsActive: false,
                  marketplaceRole: null,
                  marketplaceStatus: null,
                  professionalApproval: null,
                }
              if (await hasMarketplaceMembership(subject)) return undefined
              return {
                emailVerified: false,
                administratorIsActive: true,
                marketplaceRole: null,
                marketplaceStatus: null,
                professionalApproval: null,
              }
            }
            const [state] = await db
              .select({
                emailVerified: user.emailVerified,
                administratorIsActive: admins.isActive,
                marketplaceRole: marketplaceAccounts.role,
                marketplaceStatus: marketplaceAccounts.status,
                professionalApproval: professionalAccounts.approvalStatus,
              })
              .from(user)
              .leftJoin(admins, eq(admins.authSubject, user.id))
              .leftJoin(
                marketplaceAccounts,
                eq(marketplaceAccounts.authSubject, user.id),
              )
              .leftJoin(
                professionalAccounts,
                eq(professionalAccounts.accountId, marketplaceAccounts.id),
              )
              .where(eq(user.id, subject))
              .limit(1)
            return state
          },
        }),
      },
    },
  },
})
