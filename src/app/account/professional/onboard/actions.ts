'use server'

import { createProfessionalOnboardingAction } from '@/lib/professional-onboarding-action'
import { isDisposableProfessionalOnboardingPageEnabled } from '@/lib/professional-onboarding-gate'
import { startProfessionalOnboarding } from '@/lib/professional-onboarding-server'
import type { ProfessionalOnboardingActionState } from '@/lib/professional-onboarding-action'

const submit = createProfessionalOnboardingAction({
  enabled: () => isDisposableProfessionalOnboardingPageEnabled(),
  start: startProfessionalOnboarding,
})

export async function beginProfessionalOnboardingAction(
  _state: ProfessionalOnboardingActionState,
  _formData: FormData,
): Promise<ProfessionalOnboardingActionState> {
  // The trusted operation rechecks the session, allowlist and account state.
  return submit()
}
