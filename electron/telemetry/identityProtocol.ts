import { randomUUID } from 'node:crypto'
import { chmod, mkdir, open, rename, rm } from 'node:fs/promises'
import type { AppMetadata } from './types.js'

export interface AccessToken {
  token: string
  expires_at: string
}

export interface InstallationIdentity {
  installation_key: string
  refresh_token: string
  refresh_expires_at: string
  policy_version: string
  access_token?: AccessToken
}

export interface StoredIdentity {
  schema_version: 2
  installation_key: string
  credentials: string
}

export interface RegistrationAttempt {
  request_id: string
  product_id: 'linka-type'
  platform: AppMetadata['platform']
  preference: 'allowed'
  policy_version: string
  recorded_at: string
}

export interface IdentityClientOptions {
  directory: string
  endpoint: string
  platform: AppMetadata['platform']
  policyVersion: string
}

export function parseRegistrationResponse(value: unknown, policyVersion: string, platform: AppMetadata['platform']): InstallationIdentity {
  if (!isObject(value) || !isOpaqueKey(value.installation_key) || value.product !== 'linka-type' || value.platform !== platform || value.preference !== 'allowed' || value.policy_version !== policyVersion || !isToken(value.refresh_token) || !isDate(value.refresh_expires_at)) throw new Error('invalid installation registration')
  return {
    installation_key: value.installation_key,
    refresh_token: value.refresh_token,
    refresh_expires_at: value.refresh_expires_at,
    policy_version: policyVersion,
    access_token: parseAccessToken(value.metrics_token),
  }
}

export function parseTokenResponse(value: unknown, installationKey: string): AccessToken {
  if (!isObject(value) || value.installation_key !== installationKey || value.product !== 'linka-type') throw new Error('invalid installation token response')
  const token = parseAccessToken(value.metrics_token)
  if (!token) throw new Error('missing installation access token')
  return token
}

export function parseStoredIdentity(installationKey: string, value: Record<string, unknown>): InstallationIdentity | undefined {
  if (!isToken(value.refresh_token) || !isDate(value.refresh_expires_at) || typeof value.policy_version !== 'string' || !value.policy_version) return undefined
  const access_token = value.access_token === undefined && value.access_expires_at === undefined
    ? undefined
    : parseAccessToken({ access_token: value.access_token, expires_at: value.access_expires_at, token_type: 'Bearer' })
  if ((value.access_token !== undefined || value.access_expires_at !== undefined) && !access_token) return undefined
  return { installation_key: installationKey, refresh_token: value.refresh_token, refresh_expires_at: value.refresh_expires_at, policy_version: value.policy_version, access_token }
}

export function isRegistration(value: Partial<RegistrationAttempt>, options: IdentityClientOptions): boolean {
  return typeof value.request_id === 'string' && value.product_id === 'linka-type' && value.platform === options.platform && value.preference === 'allowed' && value.policy_version === options.policyVersion && isDate(value.recorded_at) && Date.parse(value.recorded_at) > Date.now() - 24 * 60 * 60 * 1000
}

export function isDenialResponse(value: unknown, installationKey: string, policyVersion: string) {
  return isObject(value) && value.installation_key === installationKey && value.product === 'linka-type' && value.preference === 'denied' && value.policy_version === policyVersion && isDate(value.recorded_at)
}

export function endpointURL(base: string, suffix: string) {
  const url = new URL(base)
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('invalid identity endpoint')
  url.pathname = `${url.pathname.replace(/\/$/, '')}${suffix}`
  url.search = ''
  url.hash = ''
  return url.toString()
}

export async function atomicWrite(directory: string, destination: string, contents: string) {
  await mkdir(directory, { recursive: true, mode: 0o700 })
  await chmod(directory, 0o700)
  const temporary = `${destination}.${randomUUID()}.tmp`
  const file = await open(temporary, 'wx', 0o600)
  try {
    await file.writeFile(contents, 'utf8')
    await file.sync()
  } finally {
    await file.close()
  }
  if (process.platform === 'win32') await rm(destination, { force: true })
  await rename(temporary, destination)
  await chmod(destination, 0o600)
}

export function isMissing(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: unknown }).code === 'ENOENT'
}

function parseAccessToken(value: unknown): AccessToken | undefined {
  if (!isObject(value) || !isToken(value.access_token) || value.token_type !== 'Bearer' || !isDate(value.expires_at)) return undefined
  return { token: value.access_token, expires_at: value.expires_at }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isDate(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
}

function isOpaqueKey(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
}

function isToken(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 100 && value.length <= 4096
}
