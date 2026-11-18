import 'server-only'

export type MarketplaceAccountRole = 'client' | 'professional'

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
