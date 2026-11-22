import 'server-only'

import { MarketplaceAccountAccessError } from './marketplace-account-authorization'
import { ProfessionalOnboardingError } from './professional-onboarding-boundary'
import {
  isDisposableProfessionalOnboardingPageEnabled,
  isDisposableProfessionalStatusPageEnabled,
  mayStartDisposableProfessionalOnboarding,
} from './professional-onboarding-gate'

type Access<T> =
  { status: 'allowed'; value: T } | { status: 'sign-in' | 'denied' }

export async function professionalOnboardingPageAccess<
  T extends { authSubject: string },
>(
  requireClient: () => Promise<T>,
  env: Record<string, string | undefined> = process.env,
): Promise<Access<T>> {
  if (!isDisposableProfessionalOnboardingPageEnabled(env))
    return { status: 'denied' }
  try {
    const account = await requireClient()
    if (!mayStartDisposableProfessionalOnboarding(account.authSubject, env))
      return { status: 'denied' }
    return { status: 'allowed', value: account }
  } catch (error) {
    if (error instanceof MarketplaceAccountAccessError)
      return { status: error.status === 401 ? 'sign-in' : 'denied' }
    throw error
  }
}

export async function professionalStatusPageAccess<
  T extends { approvalStatus: 'pending' | 'rejected' | 'approved' },
>(
  getOwnStatus: () => Promise<T>,
  env: Record<string, string | undefined> = process.env,
): Promise<Access<T>> {
  if (!isDisposableProfessionalStatusPageEnabled(env))
    return { status: 'denied' }
  try {
    return { status: 'allowed', value: await getOwnStatus() }
  } catch (error) {
    if (error instanceof MarketplaceAccountAccessError)
      return { status: error.status === 401 ? 'sign-in' : 'denied' }
    if (error instanceof ProfessionalOnboardingError)
      return { status: 'denied' }
    throw error
  }
}
