import 'server-only'

export type SessionAdmissionState = {
  emailVerified: boolean
  administratorIsActive: boolean | null
  marketplaceRole: 'client' | 'professional' | null
  marketplaceStatus: 'active' | 'suspended' | 'closed' | null
  professionalApproval: 'pending' | 'approved' | 'rejected' | null
}

export function isClientSessionAdmissionEnabled(
  env: Record<string, string | undefined>,
) {
  return (
    env.MARKETPLACE_CLIENT_SESSION_ENABLED === 'true' &&
    env.ACCOUNT_RATE_LIMIT_ENABLED === 'true' &&
    env.NODE_ENV === 'development' &&
    !env.VERCEL_ENV
  )
}

export function isLegacyAdminSessionLookup(
  env: Record<string, string | undefined>,
) {
  return env.NODE_ENV !== 'development' || Boolean(env.VERCEL_ENV)
}

export function mayCreateSession(
  state: SessionAdmissionState | undefined,
  clientSessionEnabled: boolean,
) {
  if (!state) return false
  // An administrator record of any status excludes marketplace membership.
  if (state.administratorIsActive !== null) {
    return (
      state.administratorIsActive === true &&
      state.marketplaceRole === null &&
      state.marketplaceStatus === null &&
      state.professionalApproval === null
    )
  }
  return (
    clientSessionEnabled &&
    state.emailVerified === true &&
    state.marketplaceRole === 'client' &&
    state.marketplaceStatus === 'active' &&
    state.professionalApproval === null
  )
}

export function createSessionAdmissionGate(dependencies: {
  findState: (subject: string) => Promise<SessionAdmissionState | undefined>
  clientEnabled: () => boolean
}) {
  return async function beforeSessionCreate(newSession: { userId: string }) {
    try {
      const state = await dependencies.findState(newSession.userId)
      if (!mayCreateSession(state, dependencies.clientEnabled())) return false
    } catch {
      return false
    }
  }
}
