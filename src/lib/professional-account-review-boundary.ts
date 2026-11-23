import 'server-only'

import {
  transitionProfessionalApproval,
  type MarketplaceAccountRole,
  type MarketplaceAccountStatus,
  type ProfessionalApprovalStatus,
} from './marketplace-account-lifecycle'

export type ReviewDecision = 'approved' | 'rejected' | 'pending'

type ReviewState = {
  role: MarketplaceAccountRole
  accountStatus: MarketplaceAccountStatus
  approvalStatus: ProfessionalApprovalStatus
  emailVerified: boolean
  hasAdministratorRecord: boolean
  profileId: string | null
}

type LockedReview = {
  findState: () => Promise<ReviewState | null>
  updateDecision: (
    current: ProfessionalApprovalStatus,
    next: ReviewDecision,
    adminId: string,
    at: Date,
  ) => Promise<boolean>
  recordEvent: (
    type: 'approval_granted' | 'approval_rejected' | 'review_reopened',
    reason: string,
    adminId: string,
    at: Date,
  ) => Promise<void>
}

type Dependencies = {
  // The production dependency is requireAdmin(), including its allow-list check.
  requireAdministrator: () => Promise<{ id: string }>
  withLockedAccount: <T>(
    accountId: string,
    operation: (review: LockedReview | null) => Promise<T>,
  ) => Promise<T>
  now?: () => Date
}

export class ProfessionalAccountReviewError extends Error {
  constructor() {
    super('Professional account review could not be saved')
    this.name = 'ProfessionalAccountReviewError'
  }
}

export function createProfessionalAccountReviewBoundary(
  dependencies: Dependencies,
) {
  return async function reviewProfessionalAccount(input: {
    accountId: string
    decision: string
    reason: string
  }): Promise<void> {
    try {
      const admin = await dependencies.requireAdministrator()
      if (!admin?.id || !/^[0-9a-f-]{36}$/i.test(input.accountId))
        throw new ProfessionalAccountReviewError()
      const decision = input.decision
      if (
        decision !== 'approved' &&
        decision !== 'rejected' &&
        decision !== 'pending'
      )
        throw new ProfessionalAccountReviewError()
      const reason = input.reason?.trim()
      if (!reason || reason.length > 2000)
        throw new ProfessionalAccountReviewError()

      await dependencies.withLockedAccount(input.accountId, async (locked) => {
        if (!locked) throw new ProfessionalAccountReviewError()
        const current = await locked.findState()
        if (
          !current ||
          current.role !== 'professional' ||
          current.accountStatus !== 'active' ||
          !current.emailVerified ||
          current.hasAdministratorRecord ||
          (current.approvalStatus !== 'approved' &&
            current.approvalStatus !== 'rejected' &&
            current.approvalStatus !== 'pending') ||
          current.profileId !== null
        )
          throw new ProfessionalAccountReviewError()

        transitionProfessionalApproval({
          actor: { kind: 'administrator', adminId: admin.id },
          current: current.approvalStatus,
          next: decision,
          reason,
        })

        const at = dependencies.now?.() ?? new Date()
        if (
          !(await locked.updateDecision(
            current.approvalStatus,
            decision,
            admin.id,
            at,
          ))
        )
          throw new ProfessionalAccountReviewError()

        const type =
          decision === 'approved'
            ? 'approval_granted'
            : decision === 'rejected'
              ? 'approval_rejected'
              : 'review_reopened'
        await locked.recordEvent(type, reason, admin.id, at)
      })
    } catch {
      // Do not reveal account existence, overlap, state or database errors.
      throw new ProfessionalAccountReviewError()
    }
  }
}
