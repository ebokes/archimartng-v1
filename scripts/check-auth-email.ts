import { createInterface } from 'node:readline/promises'
import { readFileSync } from 'node:fs'
import { parse } from 'dotenv'
import {
  createDiagnosticEmailDelivery,
  readAuthEmailConfig,
} from '../src/lib/auth-email'

const required = [
  'AUTH_EMAIL_ENV',
  'AUTH_EMAIL_ORIGIN',
  'BETTER_AUTH_URL',
  'RESEND_API_KEY',
  'AUTH_EMAIL_FROM',
  'AUTH_EMAIL_REPLY_TO',
] as const

function sameOrigin(settings: Record<string, string | undefined>) {
  try {
    return (
      new URL(settings.AUTH_EMAIL_ORIGIN!).origin ===
      new URL(settings.BETTER_AUTH_URL!).origin
    )
  } catch {
    return false
  }
}

async function main() {
  // Never inherit a production API key or origin from the invoking shell.
  const settings: Record<string, string | undefined> = {
    ...parse(readFileSync('.env.local')),
    VERCEL_ENV: 'development',
  }
  const settingsPresent = required.every((name) => Boolean(settings[name]))
  const approvedAddresses =
    settings.AUTH_EMAIL_FROM === 'Archimart <accounts@archimartng.com>' &&
    settings.AUTH_EMAIL_REPLY_TO === 'archimartng@gmail.com'
  const emailConfig = readAuthEmailConfig(settings)
  const ready = emailConfig?.environment === 'development'

  console.log(`Required settings present: ${settingsPresent}`)
  console.log(`Trusted origin matches Better Auth: ${sameOrigin(settings)}`)
  console.log(`Approved sender and Reply-To: ${approvedAddresses}`)
  console.log(`Development-only delivery ready: ${ready}`)
  if (!ready) {
    process.exitCode = 1
    return
  }
  if (process.argv[2] !== '--send') return
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.error('Diagnostic send requires an interactive terminal.')
    process.exitCode = 1
    return
  }

  const prompt = createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  try {
    const recipient = (
      await prompt.question('Recipient email you control: ')
    ).trim()
    if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(recipient)) {
      console.error('Enter a valid recipient email address.')
      process.exitCode = 1
      return
    }
    const confirmation = await prompt.question(
      'Type SEND to confirm one development diagnostic email: ',
    )
    if (confirmation !== 'SEND') {
      console.log('No email sent.')
      return
    }
    await createDiagnosticEmailDelivery(emailConfig)(recipient)
    console.log(
      'Diagnostic accepted by the email provider. Confirm receipt separately.',
    )
  } finally {
    prompt.close()
  }
}

main().catch(() => {
  // No provider response, recipient, key, or connection details are printed.
  console.error('Diagnostic email could not be sent.')
  process.exitCode = 1
})
