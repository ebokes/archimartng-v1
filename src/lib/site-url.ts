export function getPublicSiteUrl(value: string | undefined): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash ||
      url.hostname.endsWith('.example') ||
      url.hostname === 'localhost' ||
      url.hostname.endsWith('.local') ||
      url.hostname === '127.0.0.1' ||
      url.hostname === '0.0.0.0' ||
      url.hostname === '[::1]'
    )
      return null
    return url.origin
  } catch {
    return null
  }
}
