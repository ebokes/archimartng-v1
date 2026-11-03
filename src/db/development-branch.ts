// The endpoint ID must be checked against Neon's development branch in the console.
// A connection string alone cannot establish its branch name.
export function assertDevelopmentConnection(
  pooledUrl: string | undefined,
  directUrl: string | undefined,
  developmentEndpointId: string | undefined,
): void {
  if (
    !developmentEndpointId ||
    !/^ep-[a-z0-9-]+$/.test(developmentEndpointId)
  ) {
    throw new Error(
      'Set NEON_DEVELOPMENT_ENDPOINT_ID to the verified development endpoint ID.',
    )
  }

  if (!pooledUrl || !directUrl) {
    throw new Error('DATABASE_URL and DATABASE_URL_DIRECT are required.')
  }

  let pooled: URL
  let direct: URL
  try {
    pooled = new URL(pooledUrl)
    direct = new URL(directUrl)
  } catch {
    throw new Error('Database URLs are invalid.')
  }

  const validProtocol = (url: URL) =>
    ['postgres:', 'postgresql:'].includes(url.protocol)
  const endpointHost = (pooler: boolean) =>
    new RegExp(
      `^${developmentEndpointId}${pooler ? '-pooler' : ''}\\.[a-z0-9.-]+\\.neon\\.tech$`,
    )

  if (
    !validProtocol(pooled) ||
    !validProtocol(direct) ||
    !endpointHost(true).test(pooled.hostname) ||
    !endpointHost(false).test(direct.hostname) ||
    pooled.hostname.replace('-pooler.', '.') !== direct.hostname ||
    pooled.pathname !== direct.pathname ||
    pooled.username !== direct.username
  ) {
    throw new Error(
      'Database URLs do not match the verified development endpoint.',
    )
  }
}
