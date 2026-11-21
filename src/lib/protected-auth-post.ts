import 'server-only'

import type { LimitDecision } from './account-rate-limit'

type EmailLimiter = (purpose: string, email: string) => Promise<LimitDecision>

export function createProtectedAuthPost(
  handler: (request: Request) => Promise<Response>,
  isEnabled: () => boolean,
  consumeEmail: EmailLimiter,
) {
  return async function protectedPost(request: Request) {
    if (!isEnabled()) return handler(request)
    const path = new URL(request.url).pathname
    if (
      path === '/api/auth/send-verification-email' ||
      path === '/api/auth/request-password-reset'
    ) {
      try {
        const body: unknown = await request.clone().json()
        const email =
          body && typeof body === 'object' && 'email' in body
            ? String(body.email).trim().toLowerCase()
            : ''
        if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
          return handler(request)
        const purpose =
          path === '/api/auth/send-verification-email'
            ? 'verification-email'
            : 'password-reset-email'
        const decision = await consumeEmail(purpose, email)
        if (!decision.allowed)
          return new Response('Too many requests', {
            status: 429,
            headers: { 'Retry-After': String(decision.retryAfter) },
          })
      } catch {
        return new Response('Service unavailable', { status: 503 })
      }
    }
    return handler(request)
  }
}
