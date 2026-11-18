import 'server-only'

import type {
  MarketplaceAccountRole,
  ProfessionalApprovalStatus,
} from './marketplace-account-authorization'

export type MarketplaceAccountStatus = 'active' | 'suspended' | 'closed'

export type LifecycleActor =
  | { kind: 'administrator'; adminId: string }
  | { kind: 'account-holder'; authSubject: string }

export class MarketplaceLifecycleError extends Error {
  constructor(
    readonly code: 'forbidden' | 'invalid_transition' | 'missing_reason',
  ) {
    super(code)
    this.name = 'MarketplaceLifecycleError'
  }
}

// Callers must obtain this identity from requireAdmin(), never from request data.
function requireAdministrator(actor: LifecycleActor): void {
  if (actor.kind !== 'administrator' || !actor.adminId.trim())
    throw new MarketplaceLifecycleError('forbidden')
}

function requireReason(reason: string): void {
  if (typeof reason !== 'string' || !reason.trim())
    throw new MarketplaceLifecycleError('missing_reason')
}

export function beginProfessionalOnboarding(input: {
  actor: LifecycleActor
  authSubject: string
  role: MarketplaceAccountRole
  status: MarketplaceAccountStatus
  emailVerified: boolean
  hasProfessionalAccount: boolean
}): { role: 'professional'; approvalStatus: 'pending' } {
  if (
    input.actor.kind !== 'account-holder' ||
    !input.actor.authSubject ||
    input.actor.authSubject !== input.authSubject
  )
    throw new MarketplaceLifecycleError('forbidden')

  if (
    input.role !== 'client' ||
    input.status !== 'active' ||
    !input.emailVerified ||
    input.hasProfessionalAccount
  )
    throw new MarketplaceLifecycleError('invalid_transition')

  return { role: 'professional', approvalStatus: 'pending' }
}

export function transitionMarketplaceAccountStatus(input: {
  actor: LifecycleActor
  current: MarketplaceAccountStatus
  next: MarketplaceAccountStatus
  reason: string
}): MarketplaceAccountStatus {
  requireAdministrator(input.actor)
  const allowed =
    (input.current === 'active' &&
      (input.next === 'suspended' || input.next === 'closed')) ||
    (input.current === 'suspended' &&
      (input.next === 'active' || input.next === 'closed'))
  if (!allowed) throw new MarketplaceLifecycleError('invalid_transition')
  requireReason(input.reason)
  return input.next
}

export function transitionProfessionalApproval(input: {
  actor: LifecycleActor
  current: ProfessionalApprovalStatus
  next: ProfessionalApprovalStatus
  reason: string
}): ProfessionalApprovalStatus {
  requireAdministrator(input.actor)
  const allowed =
    (input.current === 'pending' &&
      (input.next === 'approved' || input.next === 'rejected')) ||
    (input.current === 'rejected' && input.next === 'pending')
  if (!allowed) throw new MarketplaceLifecycleError('invalid_transition')
  requireReason(input.reason)
  return input.next
}

export function assertProfessionalProfileClaimAllowed(input: {
  actor: LifecycleActor
  role: MarketplaceAccountRole
  status: MarketplaceAccountStatus
  approvalStatus: ProfessionalApprovalStatus
  emailVerified: boolean
  manualReviewApproved: boolean
  reviewReason: string
  currentProfileId: string | null
  targetProfileId: string
  targetOwnerAccountId: string | null
  linkedApplicationProfileId: string | null
}): void {
  requireAdministrator(input.actor)
  if (
    input.role !== 'professional' ||
    input.status !== 'active' ||
    input.approvalStatus !== 'approved' ||
    !input.emailVerified ||
    !input.manualReviewApproved ||
    input.currentProfileId !== null ||
    !input.targetProfileId.trim() ||
    input.targetOwnerAccountId !== null ||
    (input.linkedApplicationProfileId !== null &&
      input.linkedApplicationProfileId !== input.targetProfileId)
  )
    throw new MarketplaceLifecycleError('invalid_transition')
  requireReason(input.reviewReason)
}
