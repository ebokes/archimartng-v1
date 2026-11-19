import 'server-only'

export type ClientRegistrationInput = {
  email: string
  name: string
  password: string
}

export type ClientRegistrationDependencies = {
  enabled: () => boolean
  createIdentity: (
    input: ClientRegistrationInput,
  ) => Promise<{ kind: 'created'; subject: string } | { kind: 'existing' }>
  markRecoverable: (subject: string) => Promise<void>
  recoverIdentity: (email: string, password: string) => Promise<string | null>
  createClientAccount: (subject: string) => Promise<string>
  clearRecoveryMarker: (subject: string) => Promise<void>
  sendVerification: (email: string) => Promise<void>
}

export class ClientRegistrationDisabledError extends Error {
  constructor() {
    super('Registration unavailable')
    this.name = 'ClientRegistrationDisabledError'
  }
}

export type ClientRegistrationResult = { accepted: true }

export function isClientRegistrationEnabled(
  env: Record<string, string | undefined>,
  developmentEmailReady: boolean,
) {
  return (
    env.MARKETPLACE_CLIENT_REGISTRATION_ENABLED === 'true' &&
    (env.VERCEL_ENV === 'preview' ||
      (env.VERCEL_ENV === undefined && env.NODE_ENV === 'development')) &&
    developmentEmailReady
  )
}

// This operation must be called only by a reviewed, gated server registration
// flow. No public route or action calls it in the current release.
export function createClientRegistration(
  dependencies: ClientRegistrationDependencies,
) {
  return async function registerClient(
    input: ClientRegistrationInput,
  ): Promise<ClientRegistrationResult> {
    if (!dependencies.enabled()) throw new ClientRegistrationDisabledError()

    const email =
      typeof input.email === 'string' ? input.email.trim().toLowerCase() : ''
    const name = typeof input.name === 'string' ? input.name.trim() : ''
    const password = typeof input.password === 'string' ? input.password : ''
    if (
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      name.length < 1 ||
      name.length > 100 ||
      password.length < 12 ||
      password.length > 128
    ) {
      // Keep the public outcome independent of existing-email state.
      return { accepted: true }
    }

    try {
      // Only the three allowlisted fields are forwarded. Supplied roles,
      // approval, or administrator flags have no effect.
      const identity = await dependencies.createIdentity({
        email,
        name,
        password,
      })
      let subject: string | null
      if (identity.kind === 'created') {
        subject = identity.subject
        if (!subject) return { accepted: true }
        // A marker is saved before account creation so a later attempt can
        // prove that this identity came from this registration flow.
        await dependencies.markRecoverable(subject)
      } else {
        subject = await dependencies.recoverIdentity(email, password)
      }
      if (!subject) return { accepted: true }

      await dependencies.createClientAccount(subject)
      // Marker cleanup and email delivery can be retried independently.
      try {
        await dependencies.clearRecoveryMarker(subject)
      } catch {}
      try {
        await dependencies.sendVerification(email)
      } catch {}
    } catch {
      // Better Auth duplicate errors, identity details and database failures
      // must not reveal whether this email is already registered.
    }
    return { accepted: true }
  }
}
