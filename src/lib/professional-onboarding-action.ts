import 'server-only'

export type ProfessionalOnboardingActionState = {
  status: 'idle' | 'pending' | 'unavailable' | 'error'
}

export function createProfessionalOnboardingAction(dependencies: {
  enabled: () => boolean
  start: () => Promise<unknown>
}) {
  return async function submitProfessionalOnboarding(): Promise<ProfessionalOnboardingActionState> {
    if (!dependencies.enabled()) return { status: 'unavailable' }
    try {
      await dependencies.start()
      return { status: 'pending' }
    } catch {
      return { status: 'error' }
    }
  }
}
