import 'server-only'

export type MarketplaceAccountRole = 'client' | 'professional'
export type ProfessionalApprovalStatus = 'pending' | 'approved' | 'rejected'

export class MarketplaceAccountAccessError extends Error {
  constructor(readonly status: 401 | 403) {
    super(status === 401 ? 'Unauthorized' : 'Forbidden')
    this.name = 'MarketplaceAccountAccessError'
  }
}

// The resolver must load a future account record linked to the session subject.
// A professional application or public listing is not an account credential.
export async function authorizeMarketplaceAccount<
  T extends {
    authSubject: string
    role: MarketplaceAccountRole
    isActive: boolean
  },
>(
  authSubject: string | undefined,
  requiredRole: MarketplaceAccountRole,
  findAccount: (subject: string) => Promise<T | undefined>,
): Promise<T> {
  if (!authSubject) throw new MarketplaceAccountAccessError(401)

  const account = await findAccount(authSubject)
  if (
    !account?.isActive ||
    account.authSubject !== authSubject ||
    account.role !== requiredRole
  )
    throw new MarketplaceAccountAccessError(403)

  return account
}

// Use the role check for onboarding/status pages. Approved professional operations
// must additionally check approval on every protected server operation.
export async function authorizeApprovedProfessional<
  T extends {
    authSubject: string
    role: MarketplaceAccountRole
    isActive: boolean
    approvalStatus?: ProfessionalApprovalStatus
  },
>(
  authSubject: string | undefined,
  findAccount: (subject: string) => Promise<T | undefined>,
): Promise<T> {
  const account = await authorizeMarketplaceAccount(
    authSubject,
    'professional',
    findAccount,
  )

  if (account.approvalStatus !== 'approved')
    throw new MarketplaceAccountAccessError(403)

  return account
}
