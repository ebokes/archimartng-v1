import 'server-only'

import {
  authorizeApprovedProfessional,
  MarketplaceAccountAccessError,
  type MarketplaceAccountRecord,
} from './marketplace-account-authorization'
import { MarketplaceAccountServiceError } from './marketplace-account-resolver'
import {
  createProfessionalProfileEditPolicy,
  ProfessionalProfileEditError,
  type ProfessionalProfileEditChanges,
} from './professional-profile-edit-policy'
import { isDisposableProfessionalStatusPageEnabled } from './professional-onboarding-gate'

type ApprovedAccount = {
  id: string
  authSubject: string
  profileId: string | null
}
export type LockedProfessionalProfileState = MarketplaceAccountRecord & {
  id: string
  emailVerified: boolean
  hasAdministratorRecord: boolean
  profileId: string | null
  ownerAccountId: string | null
  publicationStatus: 'draft' | 'archived' | 'published'
}

type LockedTransaction = {
  findState: () => Promise<LockedProfessionalProfileState | null>
  updateProfile: (
    profileId: string,
    changes: ProfessionalProfileEditChanges,
  ) => Promise<boolean>
}

type Dependencies = {
  // This must resolve the current validated Better Auth session, never request data.
  requireApproved: () => Promise<ApprovedAccount>
  // Lock the professional account, marketplace identity and stored profile in
  // that order; keep the callback and update inside the same transaction.
  withLockedProfile: <T>(
    accountId: string,
    operation: (transaction: LockedTransaction | null) => Promise<T>,
  ) => Promise<T>
}

export function createProfessionalProfileUpdateBoundary(
  dependencies: Dependencies,
) {
  return async function updateOwnProfessionalProfile(
    submittedChanges: unknown,
    env: Record<string, string | undefined> = process.env,
  ): Promise<void> {
    if (!isDisposableProfessionalStatusPageEnabled(env))
      throw new MarketplaceAccountAccessError(403)
    const approved = await dependencies.requireApproved()
    try {
      await dependencies.withLockedProfile(approved.id, async (transaction) => {
        if (!transaction) throw new MarketplaceAccountAccessError(403)
        const state = await transaction.findState()
        if (
          !state ||
          state.id !== approved.id ||
          state.authSubject !== approved.authSubject ||
          !approved.profileId ||
          state.profileId !== approved.profileId ||
          state.hasAdministratorRecord
        )
          throw new MarketplaceAccountAccessError(403)

        await authorizeApprovedProfessional(
          { id: approved.authSubject, emailVerified: state.emailVerified },
          async () => state,
        )

        // The policy checks the stored ownership link and rejects the entire
        // payload if any field is outside the approved five-column allowlist.
        const edit = createProfessionalProfileEditPolicy({
          requireApproved: async () => state,
          findOwnership: async () =>
            state.profileId && state.ownerAccountId
              ? {
                  ownerAccountId: state.ownerAccountId,
                  profileId: state.profileId,
                  publicationStatus: state.publicationStatus,
                }
              : null,
        })
        const { profileId, changes } = await edit(submittedChanges, env)
        if (!(await transaction.updateProfile(profileId, changes)))
          throw new MarketplaceAccountAccessError(403)
      })
    } catch (error) {
      if (
        error instanceof MarketplaceAccountAccessError ||
        error instanceof ProfessionalProfileEditError ||
        error instanceof MarketplaceAccountServiceError
      )
        throw error
      throw new MarketplaceAccountServiceError()
    }
  }
}
