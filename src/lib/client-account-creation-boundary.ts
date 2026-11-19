import 'server-only'

// Only a reviewed server-side registration/recovery flow may supply this callback.
// The identity must come from Better Auth, never from form fields or a URL.
export type AuthorizedClientIdentity = { subject: string }

export type LockedClientIdentity = {
  exists: boolean
  hasAdministratorRecord: () => Promise<boolean>
  findMarketplaceAccount: () => Promise<{
    id: string
    role: 'client' | 'professional'
  } | null>
  insertClientAccount: () => Promise<{ id: string }>
}

export type ClientAccountCreationDependencies = {
  getAuthorizedIdentity: () => Promise<AuthorizedClientIdentity | null>
  withLockedIdentity: <T>(
    subject: string,
    operation: (identity: LockedClientIdentity) => Promise<T>,
  ) => Promise<T>
}

export class ClientAccountCreationError extends Error {
  constructor() {
    super('Client account could not be created')
    this.name = 'ClientAccountCreationError'
  }
}

export function createClientAccountCreationBoundary(
  dependencies: ClientAccountCreationDependencies,
) {
  return async function createOrRecoverClientAccount() {
    try {
      const authorized = await dependencies.getAuthorizedIdentity()
      if (!authorized?.subject || !authorized.subject.trim()) {
        throw new ClientAccountCreationError()
      }

      return await dependencies.withLockedIdentity(
        authorized.subject,
        async (identity) => {
          if (!identity.exists || (await identity.hasAdministratorRecord())) {
            throw new ClientAccountCreationError()
          }
          const existing = await identity.findMarketplaceAccount()
          if (existing) {
            if (existing.role !== 'client') {
              throw new ClientAccountCreationError()
            }
            return existing.id
          }
          const created = await identity.insertClientAccount()
          return created.id
        },
      )
    } catch {
      // Never surface database, identity or uniqueness details to a caller.
      throw new ClientAccountCreationError()
    }
  }
}
