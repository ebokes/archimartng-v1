import 'server-only'

import { MarketplaceAccountAccessError } from './marketplace-account-authorization'
import { MarketplaceAccountServiceError } from './marketplace-account-resolver'
import {
  isDisposableProfessionalStatusPageEnabled,
  mayViewDisposableProfessionalStatus,
} from './professional-onboarding-gate'

export type OwnProfessionalProfile = {
  id: string
  slug: string
  displayName: string
  headline: string | null
  bio: string
  specialty: string
  city: string | null
  state: string | null
  country: string | null
  websiteUrl: string | null
  publicationStatus: 'draft' | 'published' | 'archived'
  verificationStatus: 'unverified' | 'verified' | 'rejected'
}

type OwnedRow = OwnProfessionalProfile & { ownerAccountId: string }

type Dependencies = {
  requireApproved: () => Promise<{
    id: string
    authSubject: string
    profileId: string | null
  }>
  findOwned: (accountId: string, profileId: string) => Promise<OwnedRow | null>
}

export function createOwnProfessionalProfileReader(dependencies: Dependencies) {
  return async function getOwnProfile(
    env: Record<string, string | undefined> = process.env,
  ): Promise<OwnProfessionalProfile | null> {
    if (!isDisposableProfessionalStatusPageEnabled(env))
      throw new MarketplaceAccountAccessError(403)

    const account = await dependencies.requireApproved()
    if (!mayViewDisposableProfessionalStatus(account.authSubject, env))
      throw new MarketplaceAccountAccessError(403)
    if (!account.profileId) return null

    let row: OwnedRow | null
    try {
      row = await dependencies.findOwned(account.id, account.profileId)
    } catch {
      throw new MarketplaceAccountServiceError()
    }
    if (
      !row ||
      row.ownerAccountId !== account.id ||
      row.id !== account.profileId
    )
      throw new MarketplaceAccountAccessError(403)

    const { ownerAccountId: _ownerAccountId, ...profile } = row
    return profile
  }
}
