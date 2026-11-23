import 'server-only'

import {
  MarketplaceLifecycleError,
  transitionMarketplaceAccountStatus,
  type MarketplaceAccountRole,
  type MarketplaceAccountStatus,
  type ProfessionalApprovalStatus,
} from './marketplace-account-lifecycle'

export class MarketplaceAccountStatusError extends Error {
  constructor() {
    super('Account status change unavailable')
    this.name = 'MarketplaceAccountStatusError'
  }
}

type LockedState = {
  authSubject: string
  role: MarketplaceAccountRole
  status: MarketplaceAccountStatus
  hasAdministratorRecord: boolean
  hasProfessionalAccount: boolean
  approvalStatus: ProfessionalApprovalStatus | null
}

type LockedAccount = {
  findState: () => Promise<LockedState | null>
  changeStatus: (
    current: 'active' | 'suspended',
    next: 'active' | 'suspended',
    at: Date,
  ) => Promise<boolean>
  recordEvent: (
    action: 'account_suspended' | 'account_restored',
    adminId: string,
    reason: string,
    at: Date,
  ) => Promise<void>
  revokeSessions: (subject: string) => Promise<void>
}

type Dependencies = {
  // The production adapter must call requireAdmin() for every invocation.
  requireAdministrator: () => Promise<{ id: string }>
  // Lock the active admin and target identity/account, then keep every write
  // and session deletion in the same database transaction.
  withLockedAccount: <T>(
    accountId: string,
    adminId: string,
    operation: (account: LockedAccount | null) => Promise<T>,
  ) => Promise<T>
}

export function createMarketplaceAccountStatusBoundary(deps: Dependencies) {
  return async function changeMarketplaceAccountStatus(input: {
    accountId: string
    action: 'suspend' | 'restore'
    reason: string
  }): Promise<void> {
    const admin = await deps.requireAdministrator()
    if (
      !admin?.id ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        input.accountId,
      ) ||
      (input.action !== 'suspend' && input.action !== 'restore')
    )
      throw new MarketplaceAccountStatusError()
    const reason = typeof input.reason === 'string' ? input.reason.trim() : ''
    if (!reason || reason.length > 2000)
      throw new MarketplaceAccountStatusError()

    try {
      await deps.withLockedAccount(
        input.accountId,
        admin.id,
        async (account) => {
          if (!account) throw new MarketplaceAccountStatusError()
          const state = await account.findState()
          if (
            !state ||
            !state.authSubject ||
            state.hasAdministratorRecord ||
            (state.role === 'client' &&
              (state.hasProfessionalAccount ||
                state.approvalStatus !== null)) ||
            (state.role === 'professional' &&
              (!state.hasProfessionalAccount ||
                !['pending', 'approved', 'rejected'].includes(
                  state.approvalStatus ?? '',
                )))
          )
            throw new MarketplaceAccountStatusError()

          const next = input.action === 'suspend' ? 'suspended' : 'active'
          // This policy also supports closure for a future operation; this
          // boundary exposes only suspension and restoration.
          transitionMarketplaceAccountStatus({
            actor: { kind: 'administrator', adminId: admin.id },
            current: state.status,
            next,
            reason,
          })
          if (state.status !== 'active' && state.status !== 'suspended')
            throw new MarketplaceAccountStatusError()
          const at = new Date()
          if (!(await account.changeStatus(state.status, next, at)))
            throw new MarketplaceAccountStatusError()
          await account.recordEvent(
            next === 'suspended' ? 'account_suspended' : 'account_restored',
            admin.id,
            reason,
            at,
          )
          if (next === 'suspended')
            await account.revokeSessions(state.authSubject)
        },
      )
    } catch (error) {
      if (error instanceof MarketplaceAccountStatusError) throw error
      if (error instanceof MarketplaceLifecycleError)
        throw new MarketplaceAccountStatusError()
      throw new MarketplaceAccountStatusError()
    }
  }
}
