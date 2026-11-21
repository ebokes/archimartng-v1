import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { config } from 'dotenv'
import { assertDevelopmentConnection } from '../src/db/development-branch'

config({ path: '.env.local', quiet: true })

async function main() {
  assertDevelopmentConnection(
    process.env.DATABASE_URL,
    process.env.DATABASE_URL_DIRECT,
    process.env.NEON_DEVELOPMENT_ENDPOINT_ID,
  )
  assert.notEqual(process.env.ACCOUNT_RATE_LIMIT_ENABLED, 'true')
  assert.notEqual(process.env.MARKETPLACE_CLIENT_REGISTRATION_ENABLED, 'true')
  assert.notEqual(process.env.MARKETPLACE_CLIENT_SESSION_ENABLED, 'true')

  const broken = new URL(process.env.DATABASE_URL!)
  broken.password = `invalid-${randomUUID()}`
  assertDevelopmentConnection(
    broken.toString(),
    process.env.DATABASE_URL_DIRECT,
    process.env.NEON_DEVELOPMENT_ENDPOINT_ID,
  )
  const origin = 'http://localhost:3012'
  const child = spawn(
    process.execPath,
    [
      'node_modules/next/dist/bin/next',
      'dev',
      '--hostname',
      'localhost',
      '--port',
      '3012',
    ],
    {
      env: {
        ...process.env,
        DATABASE_URL: broken.toString(),
        BETTER_AUTH_URL: origin,
        AUTH_EMAIL_ORIGIN: origin,
        AUTH_EMAIL_FROM: 'Archimart <accounts@archimartng.com>',
        ACCOUNT_RATE_LIMIT_ENABLED: 'true',
        MARKETPLACE_CLIENT_REGISTRATION_ENABLED: 'false',
        MARKETPLACE_CLIENT_SESSION_ENABLED: 'false',
      },
      stdio: 'ignore',
    },
  )
  try {
    let ready = false
    for (let i = 0; i < 40; i++) {
      if (child.exitCode !== null) break
      try {
        const response = await fetch(`${origin}/privacy`, {
          signal: AbortSignal.timeout(2000),
        })
        if (response.ok) {
          ready = true
          break
        }
      } catch {}
      await delay(500)
    }
    assert.equal(ready, true, 'Isolated server did not start.')
    const response = await fetch(`${origin}/api/auth/request-password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: origin },
      body: JSON.stringify({
        email: `unregistered-${randomUUID().replaceAll('-', '')}@example.invalid`,
      }),
      signal: AbortSignal.timeout(20000),
    })
    const body = await response.text()
    assert.equal(response.status, 503)
    assert.equal(body, 'Service unavailable')
    assert.doesNotMatch(body, /postgres|database|secret|connection/i)
    console.log(
      'Mounted reset-initiation endpoint returned a generic 503 when its development counter storage was deliberately unavailable.',
    )
  } finally {
    child.kill('SIGINT')
    await Promise.race([
      new Promise<void>((resolve) => child.once('exit', () => resolve())),
      delay(5000),
    ])
    if (child.exitCode === null) child.kill('SIGTERM')
  }
}

main().catch(() => {
  console.error(
    'Isolated HTTP storage-failure check failed; no account operation was attempted.',
  )
  process.exitCode = 1
})
