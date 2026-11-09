export const MAX_PLAN_IMAGE_BYTES = 4 * 1024 * 1024

type ImageType = {
  contentType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif'
  extension: 'jpg' | 'png' | 'webp' | 'avif'
}

function detectImageType(bytes: Uint8Array): ImageType | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return { contentType: 'image/jpeg', extension: 'jpg' }
  }
  if (
    bytes.length >= 8 &&
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
      (byte, index) => bytes[index] === byte,
    )
  ) {
    return { contentType: 'image/png', extension: 'png' }
  }
  const ascii = (start: number, end: number) =>
    String.fromCharCode(...bytes.slice(start, end))
  if (bytes.length >= 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') {
    return { contentType: 'image/webp', extension: 'webp' }
  }
  if (
    bytes.length >= 12 &&
    ascii(4, 8) === 'ftyp' &&
    ['avif', 'avis'].includes(ascii(8, 12))
  ) {
    return { contentType: 'image/avif', extension: 'avif' }
  }
  return null
}

export async function validatePlanImageUpload(file: File): Promise<ImageType> {
  if (file.size === 0 || file.size > MAX_PLAN_IMAGE_BYTES) {
    throw new Error('Choose an image of 4 MB or less.')
  }
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer())
  const type = detectImageType(bytes)
  if (!type) {
    throw new Error('Use a JPEG, PNG, WebP, or AVIF image.')
  }
  return type
}
