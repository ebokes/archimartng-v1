import 'server-only'

export class AdminAccessError extends Error {
  constructor(readonly status: 401 | 403) {
    super(status === 401 ? 'Unauthorized' : 'Forbidden')
    this.name = 'AdminAccessError'
  }
}

export async function authorizeAdmin<T extends { isActive: boolean }>(
  authSubject: string | undefined,
  findAdmin: (subject: string) => Promise<T | undefined>,
  hasMarketplaceMembership: (subject: string) => Promise<boolean>,
): Promise<T> {
  if (!authSubject) throw new AdminAccessError(401)

  const admin = await findAdmin(authSubject)
  if (!admin?.isActive) throw new AdminAccessError(403)
  if (await hasMarketplaceMembership(authSubject))
    throw new AdminAccessError(403)

  return admin
}
