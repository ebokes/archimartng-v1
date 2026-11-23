import 'server-only'

import {
  assertProfessionalProfileClaimAllowed,
  type MarketplaceAccountRole,
  type MarketplaceAccountStatus,
  type ProfessionalApprovalStatus,
} from './marketplace-account-lifecycle'
import { authorizeApprovedProfessional } from './marketplace-account-authorization'

export type ClaimState = {
  authSubject: string
  role: MarketplaceAccountRole
  status: MarketplaceAccountStatus
  approvalStatus: ProfessionalApprovalStatus
  emailVerified: boolean
  hasAdministratorRecord: boolean
  currentProfileId: string | null
  targetExists: boolean
  targetOwnerAccountId: string | null
  linkedApplicationStatus: string | null
  linkedApplicationProfileId: string | null
}

type LockedClaim = {
  findState: () => Promise<ClaimState | null>
  linkProfile: (
    profileId: string,
    adminId: string,
    at: Date,
  ) => Promise<boolean>
  recordEvent: (
    profileId: string,
    adminId: string,
    reason: string,
    at: Date,
  ) => Promise<void>
}

type Dependencies = {
  // The production dependency is requireAdmin(), not a request-supplied actor.
  requireAdministrator: () => Promise<{ id: string }>
  withLockedClaim: <T>(
    accountId: string,
    profileId: string,
    operation: (locked: LockedClaim | null) => Promise<T>,
  ) => Promise<T>
  now?: () => Date
}

export class ProfessionalProfileClaimError extends Error {
  constructor() {
    super('Profile claim could not be saved')
    this.name = 'ProfessionalProfileClaimError'
  }
}

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function createProfessionalProfileClaimBoundary(
  dependencies: Dependencies,
) {
  return async function claimProfile(input: {
    accountId: string
    profileId: string
    evidenceSummary: string
    reason: string
    evidenceReviewed: boolean
  }): Promise<void> {
    try {
      const admin = await dependencies.requireAdministrator()
      const evidence = input.evidenceSummary?.trim()
      const reason = input.reason?.trim()
      if (
        !admin?.id ||
        !uuid.test(input.accountId) ||
        !uuid.test(input.profileId) ||
        !input.evidenceReviewed ||
        !evidence ||
        !reason ||
        evidence.length > 900 ||
        reason.length > 900
      )
        throw new ProfessionalProfileClaimError()

      await dependencies.withLockedClaim(
        input.accountId,
        input.profileId,
        async (locked) => {
          if (!locked) throw new ProfessionalProfileClaimError()
          const state = await locked.findState()
          if (
            !state ||
            state.hasAdministratorRecord ||
            !state.targetExists ||
            (state.linkedApplicationStatus !== null &&
              state.linkedApplicationStatus !== 'approved')
          )
            throw new ProfessionalProfileClaimError()

          await authorizeApprovedProfessional(
            { id: state.authSubject, emailVerified: state.emailVerified },
            async () => ({
              authSubject: state.authSubject,
              role: state.role,
              status: state.status,
              approvalStatus: state.approvalStatus,
            }),
          )
          assertProfessionalProfileClaimAllowed({
            actor: { kind: 'administrator', adminId: admin.id },
            role: state.role,
            status: state.status,
            approvalStatus: state.approvalStatus,
            emailVerified: state.emailVerified,
            manualReviewApproved: input.evidenceReviewed,
            reviewReason: reason,
            currentProfileId: state.currentProfileId,
            targetProfileId: input.profileId,
            targetOwnerAccountId: state.targetOwnerAccountId,
            linkedApplicationProfileId: state.linkedApplicationProfileId,
          })

          const at = dependencies.now?.() ?? new Date()
          if (!(await locked.linkProfile(input.profileId, admin.id, at)))
            throw new ProfessionalProfileClaimError()
          await locked.recordEvent(
            input.profileId,
            admin.id,
            `Ownership evidence reviewed: ${evidence}\nDecision reason: ${reason}`,
            at,
          )
        },
      )
    } catch {
      // Hide account existence, evidence and database details from the caller.
      throw new ProfessionalProfileClaimError()
    }
  }
}
