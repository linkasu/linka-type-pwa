import { app } from 'electron'
import { rm } from 'node:fs/promises'
import { release } from 'node:os'
import { join } from 'node:path'
import { PublicInstallationIdentityClient, hasSecureTelemetryStorage, type TelemetryRequest } from './identity.js'
import { TypeMetricsTelemetry, identityEndpoint, policyVersion } from './index.js'
import { readJSON } from './transportProtocol.js'
import type { AppMetadata } from './types.js'

export function createTypeMetricsTelemetry() {
  const version = safeValue(app.getVersion())
  return new TypeMetricsTelemetry({
    userDataPath: app.getPath('userData'),
    appMetadata: { version, build: version, platform: currentPlatform(), os_version: safeValue(release()), locale: normalizeLocale(app.getLocale()) },
  })
}

export async function clearTypeTelemetryData(userDataPath: string, preference: 'unknown' | 'disabled') {
  const directory = join(userDataPath, 'telemetry-v3')
  if (preference === 'unknown') {
    await rm(directory, { recursive: true, force: true })
    return
  }
  const identity = new PublicInstallationIdentityClient({ directory, endpoint: identityEndpoint, platform: currentPlatform(), policyVersion })
  await rm(join(directory, 'spool'), { recursive: true, force: true })
  const denied = await identity.deny(standaloneJSONRequest).catch(() => false)
  if (!denied) throw new Error('telemetry denial was not delivered')
  await rm(directory, { recursive: true, force: true })
}

export function canStartTypeTelemetry(isPackaged: boolean) {
  return hasSecureTelemetryStorage() && (isPackaged || process.env.LINKA_METRICS_FORCE === '1')
}

function safeValue(value: string) {
  const normalized = value.replace(/[^A-Za-z0-9._:+-]+/g, '-').replace(/^[^A-Za-z0-9]+/, '').slice(0, 96)
  return normalized || 'unknown'
}

function currentPlatform(): AppMetadata['platform'] {
  return process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'macos' : 'linux'
}

function normalizeLocale(value: string): AppMetadata['locale'] {
  return value === 'ru' || value === 'ru-RU' || value === 'en' || value === 'en-US' ? value : 'other'
}

const standaloneJSONRequest: TelemetryRequest = async (input, init) => {
  const response = await fetch(input, { ...init, signal: AbortSignal.timeout(15_000) })
  return { ok: response.ok, status: response.status, body: await readJSON(response) }
}
