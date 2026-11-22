import 'server-only'

import {
  authorizeClientAccount,
  type MarketplaceIdentity,
} from './marketplace-account-authorization'
import {
  beginProfessionalOnboarding,
  type MarketplaceAccountRole,
  type MarketplaceAccountStatus,
} from './marketplace-account-lifecycle'

type LockedIdentity = {
  exists: boolean
  emailVerified: boolean
  hasAdministratorRecord: () => Promise<boolean>
  hasPotentialPriorActivity: () => Promise<boolean>
  findAccount: () => Promise<{
    id: string
    authSubject: string
    role: MarketplaceAccountRole
    status: MarketplaceAccountStatus
    hasProfessionalAccount: boolean
  } | null>
  changeRoleToProfessional: (accountId: string) => Promise<boolean>
  createPendingProfessionalAccount: (accountId: string) => Promise<void>
  recordOnboardingStarted: (accountId: string) => Promise<void>
}

type Dependencies = {
  getIdentity: () => Promise<MarketplaceIdentity | null>
  withLockedIdentity: <T>(
    subject: string,
    operation: (identity: LockedIdentity) => Promise<T>,
  ) => Promise<T>
}

export class ProfessionalOnboardingError extends Error {
  constructor() {
    super('Professional onboarding is unavailable')
    this.name = 'ProfessionalOnboardingError'
  }
}

// This is a private server boundary. No request may supply an identity or role.
export function createProfessionalOnboardingBoundary(
  dependencies: Dependencies,
) {
  return async function startProfessionalOnboarding(): Promise<string> {
    try {
      const identity = await dependencies.getIdentity()
      if (!identity?.id) throw new ProfessionalOnboardingError()

      return await dependencies.withLockedIdentity(
        identity.id,
        async (locked) => {
          if (!locked.exists || (await locked.hasAdministratorRecord()))
            throw new ProfessionalOnboardingError()

          const account = await locked.findAccount()
          const authorized = await authorizeClientAccount(
            {
              id: identity.id,
              emailVerified: identity.emailVerified && locked.emailVerified,
            },
            async () =>
              account
                ? {
                    ...account,
                    approvalStatus: account.hasProfessionalAccount
                      ? ('pending' as const)
                      : null,
                  }
                : undefined,
          )
          beginProfessionalOnboarding({
            actor: { kind: 'account-holder', authSubject: identity.id },
            authSubject: authorized.authSubject,
            role: authorized.role,
            status: authorized.status,
            emailVerified: identity.emailVerified && locked.emailVerified,
            hasProfessionalAccount: authorized.hasProfessionalAccount,
          })
          if (await locked.hasPotentialPriorActivity())
            throw new ProfessionalOnboardingError()

          if (!(await locked.changeRoleToProfessional(authorized.id)))
            throw new ProfessionalOnboardingError()
          await locked.createPendingProfessionalAccount(authorized.id)
          await locked.recordOnboardingStarted(authorized.id)
          return authorized.id
        },
      )
    } catch {
      // Never expose membership, auth, uniqueness or database details.
      throw new ProfessionalOnboardingError()
    }
  }
}
