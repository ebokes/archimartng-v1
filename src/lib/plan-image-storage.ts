import 'server-only'

import { randomUUID } from 'node:crypto'
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { validatePlanImageUpload } from '@/lib/plan-image-upload'

function storageConfig() {
  const environment = process.env.PLAN_IMAGE_ENV
  if (environment !== 'development' && environment !== 'production') {
    throw new Error('Image upload storage environment is not configured.')
  }
  const prefix = environment === 'production' ? 'PROD' : 'DEV'
  const read = (name: string) => process.env[`PLAN_IMAGE_${prefix}_${name}`]
  const endpoint = read('ENDPOINT')
  const bucket = read('BUCKET')
  const publicBaseUrl = read('PUBLIC_BASE_URL')
  const accessKeyId = read('ACCESS_KEY_ID')
  const secretAccessKey = read('SECRET_ACCESS_KEY')
  const region = read('REGION')
  if (
    !endpoint ||
    !bucket ||
    !publicBaseUrl ||
    !accessKeyId ||
    !secretAccessKey ||
    !region
  ) {
    throw new Error(
      'Image upload storage is not configured for this environment.',
    )
  }
  try {
    const endpointUrl = new URL(endpoint)
    const publicUrl = new URL(publicBaseUrl)
    if (
      endpointUrl.protocol !== 'https:' ||
      !endpointUrl.hostname.endsWith('.r2.cloudflarestorage.com') ||
      publicUrl.protocol !== 'https:' ||
      publicUrl.hostname.endsWith('.example') ||
      publicUrl.hostname.endsWith('.example.com') ||
      /replace-me|placeholder/i.test(accessKeyId) ||
      /replace-me|placeholder/i.test(secretAccessKey)
    )
      throw new Error()
  } catch {
    throw new Error('Image upload storage configuration is invalid.')
  }
  return {
    endpoint,
    bucket,
    publicBaseUrl,
    accessKeyId,
    secretAccessKey,
    region,
  }
}

export function isPlanImageUploadConfigured() {
  try {
    storageConfig()
    return true
  } catch {
    return false
  }
}

function client(config: ReturnType<typeof storageConfig>) {
  return new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  })
}

export async function uploadPlanImage(file: File) {
  const { contentType, extension } = await validatePlanImageUpload(file)
  const config = storageConfig()
  const key = `plan-images/${randomUUID()}.${extension}`
  try {
    await client(config).send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    )
    return { url: `${config.publicBaseUrl.replace(/\/$/, '')}/${key}`, key }
  } catch {
    throw new Error('Image upload failed. Please try again.')
  }
}

export async function discardPlanImage(key: string) {
  try {
    const config = storageConfig()
    await client(config).send(
      new DeleteObjectCommand({ Bucket: config.bucket, Key: key }),
    )
  } catch {
    // A failed cleanup must not hide the database error.
  }
}
