import 'server-only'

type EmailKind = 'verification' | 'password-reset'
type Environment = 'development' | 'production'

export type AuthEmailConfig = {
  apiKey: string
  from: string
  replyTo: string
  origin: string
  environment: Environment
}

export class AuthEmailError extends Error {
  constructor(
    readonly code: 'NOT_CONFIGURED' | 'INVALID_LINK' | 'DELIVERY_FAILED',
  ) {
    super('Account email unavailable')
    this.name = 'AuthEmailError'
  }
}

function applicationOrigin(value: string | undefined) {
  if (!value) return null
  try {
    const url = new URL(value)
    if (
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash ||
      !['http:', 'https:'].includes(url.protocol)
    )
      return null
    return url.origin
  } catch {
    return null
  }
}

export function readAuthEmailConfig(
  env: Record<string, string | undefined>,
): AuthEmailConfig | null {
  const environment = env.AUTH_EMAIL_ENV
  const origin = applicationOrigin(env.AUTH_EMAIL_ORIGIN)
  const authOrigin = applicationOrigin(env.BETTER_AUTH_URL)
  const apiKey = env.RESEND_API_KEY
  const from = env.AUTH_EMAIL_FROM
  const replyTo = env.AUTH_EMAIL_REPLY_TO
  if (
    !origin ||
    origin !== authOrigin ||
    !apiKey ||
    !/^re_[A-Za-z0-9_\-]+$/.test(apiKey) ||
    from !== 'Archimart <accounts@archimartng.com>' ||
    replyTo !== 'archimartng@gmail.com'
  )
    return null

  if (environment === 'production') {
    if (
      env.VERCEL_ENV !== 'production' ||
      origin !== 'https://archimartng.com'
    ) {
      return null
    }
  } else if (environment === 'development') {
    if (
      env.VERCEL_ENV === 'production' ||
      origin === 'https://archimartng.com'
    ) {
      return null
    }
    const host = new URL(origin).hostname
    if (
      origin.startsWith('http:') &&
      !['localhost', '127.0.0.1'].includes(host)
    ) {
      return null
    }
  } else return null

  return { apiKey, from, replyTo, origin, environment }
}

function validCallback(value: string, origin: string) {
  if (
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !value.startsWith('/\\')
  ) {
    return true
  }
  try {
    const url = new URL(value)
    return url.origin === origin && !url.username && !url.password
  } catch {
    return false
  }
}

export function validateAuthEmailLink(
  kind: EmailKind,
  link: string,
  token: string,
  origin: string,
) {
  if (!token || token.length > 4096 || /[\s/#?]/.test(token)) {
    throw new AuthEmailError('INVALID_LINK')
  }
  try {
    const url = new URL(link)
    if (url.origin !== origin || url.hash || url.username || url.password) {
      throw new Error()
    }
    if (kind === 'verification') {
      if (
        url.pathname !== '/api/auth/verify-email' ||
        url.searchParams.get('token') !== token
      ) {
        throw new Error()
      }
    } else if (
      url.pathname !==
        `/api/auth/reset-password/${encodeURIComponent(token)}` ||
      url.searchParams.has('token')
    )
      throw new Error()
    if (
      [...url.searchParams.keys()].some(
        (key) => !['token', 'callbackURL'].includes(key),
      )
    ) {
      throw new Error()
    }
    const callback = url.searchParams.get('callbackURL')
    if (callback && !validCallback(callback, origin)) throw new Error()
    return url.toString()
  } catch {
    throw new AuthEmailError('INVALID_LINK')
  }
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character]!,
  )
}

export function renderAuthEmail(kind: EmailKind, link: string) {
  const verification = kind === 'verification'
  const title = verification
    ? 'Verify your Archimart email'
    : 'Reset your Archimart password'
  const action = verification ? 'Verify email' : 'Reset password'
  const explanation = verification
    ? 'Use this link to verify the email address for your Archimart account.'
    : 'Use this link to set a new password for your Archimart account.'
  const safeLink = escapeHtml(link)
  return {
    subject: title,
    text: `${title}\n\n${explanation}\n\n${link}\n\nIf you did not request this, you can ignore this email.`,
    html: `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f5f3ee;font-family:Arial,sans-serif;color:#17211c"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border-radius:12px"><tr><td style="padding:32px 24px"><p style="font-size:14px;font-weight:bold;letter-spacing:.08em">ARCHIMART</p><h1 style="font-size:25px;line-height:1.25">${title}</h1><p style="font-size:16px;line-height:1.5">${explanation}</p><p style="margin:28px 0"><a href="${safeLink}" style="display:inline-block;background:#183c2c;color:#fff;padding:14px 20px;border-radius:6px;text-decoration:none">${action}</a></p><p style="font-size:14px;line-height:1.5;overflow-wrap:anywhere">Or copy this link into your browser:<br><a href="${safeLink}">${safeLink}</a></p><p style="font-size:13px;line-height:1.5;color:#555">If you did not request this, you can ignore this email.</p></td></tr></table></td></tr></table></body></html>`,
  }
}

export function createAuthEmailDelivery(
  config: AuthEmailConfig | null,
  transport: typeof fetch = fetch,
) {
  return async function deliver(
    kind: EmailKind,
    to: string,
    link: string,
    token: string,
  ) {
    if (!config) throw new AuthEmailError('NOT_CONFIGURED')
    const safeLink = validateAuthEmailLink(kind, link, token, config.origin)
    await sendResendEmail(
      config,
      transport,
      to,
      renderAuthEmail(kind, safeLink),
    )
  }
}

async function sendResendEmail(
  config: AuthEmailConfig,
  transport: typeof fetch,
  to: string,
  content: { subject: string; text: string; html: string },
) {
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(to)) {
    throw new AuthEmailError('DELIVERY_FAILED')
  }
  try {
    const response = await transport('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: config.from,
        to: [to],
        reply_to: config.replyTo,
        ...content,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    })
    if (!response.ok) throw new Error()
  } catch {
    // Provider responses may include addresses or message data.
    throw new AuthEmailError('DELIVERY_FAILED')
  }
}

export function createDiagnosticEmailDelivery(
  config: AuthEmailConfig | null,
  transport: typeof fetch = fetch,
) {
  return async function sendDiagnostic(to: string) {
    if (!config || config.environment !== 'development') {
      throw new AuthEmailError('NOT_CONFIGURED')
    }
    await sendResendEmail(config, transport, to, {
      subject: 'Archimart development email diagnostic',
      text: 'This is a test of Archimart development email delivery. No action is needed.',
      html: '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:Arial,sans-serif;line-height:1.5;padding:24px"><h1 style="font-size:22px">Archimart email diagnostic</h1><p>This is a test of Archimart development email delivery. No action is needed.</p></body></html>',
    })
  }
}
