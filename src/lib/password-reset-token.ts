export function readPasswordResetToken(search: string) {
  const params = new URLSearchParams(search)
  if (params.has('error') || params.getAll('token').length !== 1) return null
  const token = params.get('token')
  return token && /^[A-Za-z0-9_-]{16,256}$/.test(token) ? token : null
}
