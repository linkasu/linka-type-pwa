import { safeStorage } from 'electron'
import { randomUUID } from 'node:crypto'
import { readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import {
  atomicWrite,
  endpointURL,
  isDenialResponse,
  isMissing,
  isRegistration,
  parseRegistrationResponse,
  parseStoredIdentity,
  parseTokenResponse,
  type IdentityClientOptions,
  type InstallationIdentity,
  type RegistrationAttempt,
  type StoredIdentity,
} from './identityProtocol.js'

export type TelemetryRequest = (input: string, init: RequestInit) => Promise<{ ok: boolean; status: number; body: unknown }>

export class TelemetryDeniedError extends Error {
  constructor() {
    super('telemetry denied')
    this.name = 'TelemetryDeniedError'
  }
}

export const hasSecureTelemetryStorage = () => safeStorage.isEncryptionAvailable()

export class PublicInstallationIdentityClient {
  private readonly identityPath: string
  private readonly registrationPath: string
  private loaded = false
  private unavailable = false
  private identity?: InstallationIdentity

  constructor(private readonly options: IdentityClientOptions) {
    this.identityPath = join(options.directory, 'installation-v2.json')
    this.registrationPath = join(options.directory, 'registration-v2.json')
  }

  async getAccess(request: TelemetryRequest): Promise<InstallationIdentity> {
    if (!hasSecureTelemetryStorage()) throw new Error('secure telemetry storage is unavailable')
    const identity = await this.getIdentity(request)
    if (identity.access_token && Date.parse(identity.access_token.expires_at) > Date.now() + 60_000) return identity

    const response = await request(endpointURL(this.options.endpoint, '/v1/public/installations/token'), {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${identity.refresh_token}` },
      body: '{}',
    })
    if (response.status === 403) throw new TelemetryDeniedError()
    if (!response.ok) throw new Error('installation token refresh rejected')
    const token = parseTokenResponse(response.body, identity.installation_key)
    identity.access_token = token
    await this.save(identity)
    return identity
  }

  async invalidateAccess() {
    await this.load()
    if (!this.identity?.access_token) return
    this.identity.access_token = undefined
    await this.save(this.identity)
  }

  async deny(request: TelemetryRequest) {
    await this.load()
    if (this.unavailable) return false
    if (!this.identity) {
      await this.clear()
      return true
    }
    const response = await request(endpointURL(this.options.endpoint, '/v1/public/installations/telemetry-preference'), {
      method: 'PUT',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${this.identity.refresh_token}` },
      body: JSON.stringify({ preference: 'denied', policy_version: this.identity.policy_version, recorded_at: new Date().toISOString() }),
    })
    if (response.status !== 200 || !isDenialResponse(response.body, this.identity.installation_key, this.identity.policy_version)) return false
    await this.clear()
    return true
  }

  async clear() {
    this.identity = undefined
    this.loaded = true
    this.unavailable = false
    await Promise.all([rm(this.identityPath, { force: true }), rm(this.registrationPath, { force: true })])
  }

  private async getIdentity(request: TelemetryRequest) {
    await this.load()
    if (this.unavailable) throw new Error('stored installation credential is unavailable')
    if (this.identity) return this.identity

    const registration = await this.loadRegistration()
    const response = await request(endpointURL(this.options.endpoint, '/v1/public/installations'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(registration),
    })
    if (!response.ok) throw new Error('installation registration rejected')
    const identity = parseRegistrationResponse(response.body, registration.policy_version, this.options.platform)
    this.identity = identity
    this.loaded = true
    await this.save(identity)
    await rm(this.registrationPath, { force: true })
    return identity
  }

  private async load() {
    if (this.loaded) return
    this.loaded = true
    let stored: Partial<StoredIdentity>
    try {
      stored = JSON.parse(await readFile(this.identityPath, 'utf8')) as Partial<StoredIdentity>
    } catch (error) {
      if (!isMissing(error)) this.unavailable = true
      return
    }
    if (stored.schema_version !== 2 || !isInstallationKey(stored.installation_key) || typeof stored.credentials !== 'string' || !hasSecureTelemetryStorage()) {
      this.unavailable = true
      return
    }
    try {
      const credentials = safeStorage.decryptString(Buffer.from(stored.credentials, 'base64'))
      this.identity = parseStoredIdentity(stored.installation_key, JSON.parse(credentials) as Record<string, unknown>)
      if (!this.identity) this.unavailable = true
    } catch {
      this.unavailable = true
    }
  }

  private async loadRegistration(): Promise<RegistrationAttempt> {
    try {
      const stored = JSON.parse(await readFile(this.registrationPath, 'utf8')) as Partial<RegistrationAttempt>
      if (isRegistration(stored, this.options)) return stored as RegistrationAttempt
    } catch {
      // Create a durable registration attempt below.
    }
    const registration: RegistrationAttempt = {
      request_id: randomUUID(),
      product_id: 'linka-type',
      platform: this.options.platform,
      preference: 'allowed',
      policy_version: this.options.policyVersion,
      recorded_at: new Date().toISOString(),
    }
    await atomicWrite(this.options.directory, this.registrationPath, JSON.stringify(registration))
    return registration
  }

  private async save(identity: InstallationIdentity) {
    if (!hasSecureTelemetryStorage()) throw new Error('secure telemetry storage is unavailable')
    const credentials = JSON.stringify({
      refresh_token: identity.refresh_token,
      refresh_expires_at: identity.refresh_expires_at,
      policy_version: identity.policy_version,
      access_token: identity.access_token?.token,
      access_expires_at: identity.access_token?.expires_at,
    })
    const stored: StoredIdentity = {
      schema_version: 2,
      installation_key: identity.installation_key,
      credentials: safeStorage.encryptString(credentials).toString('base64'),
    }
    await atomicWrite(this.options.directory, this.identityPath, JSON.stringify(stored))
  }
}

function isInstallationKey(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
}
