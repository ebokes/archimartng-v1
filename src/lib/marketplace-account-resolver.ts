import 'server-only'

import {
  authorizeApprovedProfessional,
  authorizeClientAccount,
  authorizeProfessionalOnboarding,
  MarketplaceAccountAccessError,
  type MarketplaceAccountRecord,
  type MarketplaceIdentity,
} from './marketplace-account-authorization'

export type ResolvedMarketplaceAccount = MarketplaceAccountRecord & {
  id: string
  profileId: string | null
}

export type MarketplaceAccountLookup =
  | {
      account: ResolvedMarketplaceAccount
      administratorIsActive: boolean | null
    }
  | undefined

export class MarketplaceAccountServiceError extends Error {
  readonly status = 503

  constructor() {
    super('Marketplace account temporarily unavailable')
    this.name = 'MarketplaceAccountServiceError'
  }
}

type Dependencies = {
  getIdentity: () => Promise<MarketplaceIdentity | null>
  findAccount: (subject: string) => Promise<MarketplaceAccountLookup>
}

export function createMarketplaceAccountResolver(dependencies: Dependencies) {
  async function getIdentity() {
    try {
      return await dependencies.getIdentity()
    } catch {
      throw new MarketplaceAccountServiceError()
    }
  }

  async function findAccount(subject: string) {
    let result: MarketplaceAccountLookup
    try {
      result = await dependencies.findAccount(subject)
    } catch {
      throw new MarketplaceAccountServiceError()
    }

    // Check all admin records, including inactive ones. A dual identity is invalid.
    if (result && result.administratorIsActive !== null) {
      throw new MarketplaceAccountAccessError(403)
    }

    return result?.account
  }

  return {
    async requireClient() {
      return authorizeClientAccount(await getIdentity(), findAccount)
    },
    async requireProfessionalOnboarding() {
      return authorizeProfessionalOnboarding(await getIdentity(), findAccount)
    },
    async requireApprovedProfessional() {
      return authorizeApprovedProfessional(await getIdentity(), findAccount)
    },
  }
}
