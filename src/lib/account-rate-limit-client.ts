import 'server-only'

import { isIP } from 'node:net'

export function trustedClientAddress(
  headers: Headers,
  env: Record<string, string | undefined>,
) {
  if (!env.VERCEL_ENV) {
    return env.NODE_ENV === 'development' ? 'local-development' : null
  }
  const value = headers.get('x-vercel-forwarded-for')?.trim()
  if (!value || value.includes(',') || !isIP(value)) return null
  if (isIP(value) === 6) {
    try {
      return new URL(`http://[${value}]`).hostname
    } catch {
      return null
    }
  }
  return value
}
