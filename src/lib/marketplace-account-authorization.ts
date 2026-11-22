import 'server-only'

import type {
  MarketplaceAccountRole,
  MarketplaceAccountStatus,
  ProfessionalApprovalStatus,
} from './marketplace-account-lifecycle'

// Pass only Better Auth's server-validated user. Never build this from form data.
export type MarketplaceIdentity = { id: string; emailVerified: boolean }

// The resolver must read these values from a trusted account query, including
// the professional approval row. A public application or listing is not an account.
export type MarketplaceAccountRecord = {
  authSubject: string
  role: MarketplaceAccountRole
  status: MarketplaceAccountStatus
  approvalStatus: ProfessionalApprovalStatus | null
}

export class MarketplaceAccountAccessError extends Error {
  constructor(readonly status: 401 | 403) {
    super(status === 401 ? 'Unauthorized' : 'Forbidden')
    this.name = 'MarketplaceAccountAccessError'
  }
}

type Access =
  | 'client'
  | 'professional_status'
  | 'professional_onboarding'
  | 'approved_professional'

async function authorizeMarketplaceAccount<T extends MarketplaceAccountRecord>(
  identity: MarketplaceIdentity | null | undefined,
  access: Access,
  findAccount: (subject: string) => Promise<T | undefined>,
): Promise<T> {
  if (!identity?.id) throw new MarketplaceAccountAccessError(401)
  if (identity.emailVerified !== true)
    throw new MarketplaceAccountAccessError(403)

  const account = await findAccount(identity.id)
  if (
    !account ||
    account.authSubject !== identity.id ||
    account.status !== 'active'
  )
    throw new MarketplaceAccountAccessError(403)

  const permitted =
    (access === 'client' &&
      account.role === 'client' &&
      account.approvalStatus === null) ||
    (access === 'professional_status' &&
      account.role === 'professional' &&
      (account.approvalStatus === 'pending' ||
        account.approvalStatus === 'rejected' ||
        account.approvalStatus === 'approved')) ||
    (access === 'professional_onboarding' &&
      account.role === 'professional' &&
      (account.approvalStatus === 'pending' ||
        account.approvalStatus === 'rejected')) ||
    (access === 'approved_professional' &&
      account.role === 'professional' &&
      account.approvalStatus === 'approved')

  if (!permitted) throw new MarketplaceAccountAccessError(403)
  return account
}

export function authorizeClientAccount<T extends MarketplaceAccountRecord>(
  identity: MarketplaceIdentity | null | undefined,
  findAccount: (subject: string) => Promise<T | undefined>,
): Promise<T> {
  return authorizeMarketplaceAccount(identity, 'client', findAccount)
}

export function authorizeProfessionalOnboarding<
  T extends MarketplaceAccountRecord,
>(
  identity: MarketplaceIdentity | null | undefined,
  findAccount: (subject: string) => Promise<T | undefined>,
): Promise<T> {
  return authorizeMarketplaceAccount(
    identity,
    'professional_onboarding',
    findAccount,
  )
}

export function authorizeProfessionalStatus<T extends MarketplaceAccountRecord>(
  identity: MarketplaceIdentity | null | undefined,
  findAccount: (subject: string) => Promise<T | undefined>,
): Promise<T> {
  return authorizeMarketplaceAccount(
    identity,
    'professional_status',
    findAccount,
  )
}

export function authorizeApprovedProfessional<
  T extends MarketplaceAccountRecord,
>(
  identity: MarketplaceIdentity | null | undefined,
  findAccount: (subject: string) => Promise<T | undefined>,
): Promise<T> {
  return authorizeMarketplaceAccount(
    identity,
    'approved_professional',
    findAccount,
  )
}
