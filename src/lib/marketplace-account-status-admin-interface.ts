import 'server-only'

import { MarketplaceAccountStatusError } from './marketplace-account-status-boundary'

export type AccountStatusSummary = {
  id: string
  name: string
  email: string
  role: 'client' | 'professional'
  status: 'active' | 'suspended' | 'closed'
  approvalStatus: 'pending' | 'approved' | 'rejected' | null
}

export type AccountStatusDetail = AccountStatusSummary & {
  events: Array<{
    id: string
    action: string
    reason: string
    createdAt: Date
    actorName: string
  }>
}

export function isLocalAccountStatusManagementEnabled(
  env: NodeJS.ProcessEnv = process.env,
) {
  return (
    env.NODE_ENV === 'development' &&
    !env.VERCEL_ENV &&
    env.MARKETPLACE_ACCOUNT_STATUS_MANAGEMENT_ENABLED === 'true'
  )
}

type Dependencies = {
  requireAdministrator: () => Promise<unknown>
  enabled: () => boolean
  list: () => Promise<AccountStatusSummary[]>
  detail: (id: string) => Promise<AccountStatusDetail | null>
  change: (input: {
    accountId: string
    action: 'suspend' | 'restore'
    reason: string
  }) => Promise<void>
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function createAccountStatusAdminInterface(deps: Dependencies) {
  async function authorize() {
    await deps.requireAdministrator()
    if (!deps.enabled()) throw new MarketplaceAccountStatusError()
  }

  return {
    async list() {
      await authorize()
      return deps.list()
    },
    async detail(id: string) {
      await authorize()
      if (!uuidPattern.test(id)) return null
      return deps.detail(id)
    },
    async change(input: { accountId: string; action: string; reason: string }) {
      await authorize()
      if (
        !uuidPattern.test(input.accountId) ||
        (input.action !== 'suspend' && input.action !== 'restore') ||
        typeof input.reason !== 'string' ||
        !input.reason.trim() ||
        input.reason.trim().length > 2000
      )
        throw new MarketplaceAccountStatusError()
      // The existing boundary repeats requireAdmin(), locks the account,
      // applies lifecycle policy, writes history and revokes sessions.
      await deps.change({
        accountId: input.accountId,
        action: input.action,
        reason: input.reason,
      })
    },
  }
}

export async function submitAccountStatusChange(
  accountId: string,
  formData: FormData,
  change: Dependencies['change'],
) {
  const keys = [...formData.keys()].filter((key) => !key.startsWith('$ACTION_'))
  if (keys.length !== 2 || !keys.includes('action') || !keys.includes('reason'))
    throw new MarketplaceAccountStatusError()
  const action = formData.get('action')
  const reason = formData.get('reason')
  if (typeof action !== 'string' || typeof reason !== 'string')
    throw new MarketplaceAccountStatusError()
  await change({ accountId, action: action as 'suspend' | 'restore', reason })
}

export async function accountStatusFormResult(
  accountId: string,
  formData: FormData,
  change: Dependencies['change'],
): Promise<{ error: string | null; saved: boolean }> {
  try {
    await submitAccountStatusChange(accountId, formData, change)
    return { error: null, saved: true }
  } catch {
    return {
      error:
        'Status change unavailable. Check the reason and refresh the account before trying again.',
      saved: false,
    }
  }
}
