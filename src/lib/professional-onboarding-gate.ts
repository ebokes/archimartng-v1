import 'server-only'

import {
  isProfessionalOnboardingEnabled,
  isProfessionalSessionAdmissionEnabled,
} from './client-session-admission'

function matchesDisposableSubject(
  subject: string,
  env: Record<string, string | undefined>,
) {
  const configured = env.MARKETPLACE_PROFESSIONAL_TEST_SUBJECT
  return Boolean(subject && configured && configured === subject)
}

export function mayStartDisposableProfessionalOnboarding(
  subject: string,
  env: Record<string, string | undefined> = process.env,
) {
  return (
    isProfessionalOnboardingEnabled(env) &&
    matchesDisposableSubject(subject, env)
  )
}

export function mayViewDisposableProfessionalStatus(
  subject: string,
  env: Record<string, string | undefined> = process.env,
) {
  return (
    isProfessionalSessionAdmissionEnabled(env) &&
    matchesDisposableSubject(subject, env)
  )
}

export function isDisposableProfessionalOnboardingPageEnabled(
  env: Record<string, string | undefined> = process.env,
) {
  return (
    isProfessionalOnboardingEnabled(env) &&
    Boolean(env.MARKETPLACE_PROFESSIONAL_TEST_SUBJECT)
  )
}

export function isDisposableProfessionalStatusPageEnabled(
  env: Record<string, string | undefined> = process.env,
) {
  return (
    isProfessionalSessionAdmissionEnabled(env) &&
    Boolean(env.MARKETPLACE_PROFESSIONAL_TEST_SUBJECT)
  )
}
