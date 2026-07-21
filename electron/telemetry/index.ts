import { randomUUID } from 'node:crypto'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { PublicInstallationIdentityClient, TelemetryDeniedError } from './identity.js'
import { sanitizeTelemetryOutcome } from './sanitize.js'
import { FileTelemetrySpool } from './spool.js'
import { endpointURL, isAcknowledgement, isErrorCode, readJSON, retryDelayMs } from './transportProtocol.js'
import type { AppMetadata, SpoolRecord } from './types.js'

const metricsEndpoint = process.env.LINKA_METRICS_URL ?? 'https://metrics.nkolinka.ru'
export const identityEndpoint = process.env.LINKA_IDENTITY_URL ?? 'https://api.identity.linka.su'
export const policyVersion = '2026-07-19-v3'
const requestTimeoutMs = 15_000

export class TypeMetricsTelemetry {
  private readonly telemetryDirectory: string
  private readonly spool: FileTelemetrySpool
  private readonly identity: PublicInstallationIdentityClient
  private readonly appSessionId = randomUUID()
  private initialized = false
  private collecting = true
  private flushTimer?: NodeJS.Timeout
  private flushing?: Promise<void>
  private pendingFlush = false
  private retryAttempt = 0
  private requestController?: AbortController

  constructor(private readonly options: { userDataPath: string; appMetadata: AppMetadata }) {
    this.telemetryDirectory = join(options.userDataPath, 'telemetry-v3')
    this.spool = new FileTelemetrySpool(join(this.telemetryDirectory, 'spool'))
    this.identity = new PublicInstallationIdentityClient({
      directory: this.telemetryDirectory,
      endpoint: identityEndpoint,
      platform: options.appMetadata.platform,
      policyVersion,
    })
  }

  async initialize() {
    if (this.initialized || !this.collecting) return
    await this.spool.initialize()
    this.initialized = true
    this.requestFlush(0)
  }

  recordRendererOutcome(input: unknown) {
    if (!this.acceptsEvents()) return false
    const outcome = sanitizeTelemetryOutcome(input)
    if (!outcome) return false
    const payload = {
      record_id: randomUUID(),
      occurred_at: new Date().toISOString(),
      app_session_id: this.appSessionId,
      app: this.options.appMetadata,
      ...outcome,
    }
    const record: SpoolRecord = { id: payload.record_id, created_at: Date.now(), payload }
    void this.spool.enqueue(record).then((): void => this.requestFlush(0)).catch((): undefined => undefined)
    return true
  }

  stop() {
    this.collecting = false
    if (this.flushTimer) clearTimeout(this.flushTimer)
    this.flushTimer = undefined
    this.requestController?.abort()
  }

  async disableAndClear() {
    this.stop()
    await this.flushing?.catch((): undefined => undefined)
    await this.spool.clear()
    const denied = await this.identity.deny((input, init) => this.requestJSON(input, init)).catch(() => false)
    if (!denied) throw new Error('telemetry denial was not delivered')
    await rm(this.telemetryDirectory, { recursive: true, force: true })
  }

  private requestFlush(delay: number) {
    if (!this.acceptsEvents() || this.flushTimer) return
    if (this.flushing) {
      this.pendingFlush = true
      return
    }
    this.flushTimer = setTimeout(() => {
      this.flushTimer = undefined
      const flush = this.flush()
      this.flushing = flush
      void flush.finally(() => {
        if (this.flushing !== flush) return
        this.flushing = undefined
        if (this.pendingFlush) {
          this.pendingFlush = false
          this.requestFlush(0)
        }
      })
    }, delay)
    this.flushTimer.unref()
  }

  private async flush() {
    if (!this.acceptsEvents()) return
    try {
      const identity = await this.identity.getAccess((input, init) => this.requestJSON(input, init))
      if (!this.acceptsEvents()) return
      const batch = await this.spool.getBatch(identity.installation_key)
      if (!batch || !this.acceptsEvents()) return
      const response = await this.requestJSON(endpointURL(metricsEndpoint, '/v2/batches'), {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${identity.access_token?.token ?? ''}`,
          'idempotency-key': batch.batchId,
        },
        body: batch.body,
      })
      if (response.status === 401) {
        await this.identity.invalidateAccess()
        this.requestFlush(0)
        return
      }
      if (response.status === 403 && isErrorCode(response.body, 'telemetry_suppressed')) throw new TelemetryDeniedError()
      if (response.status !== 202 || !isAcknowledgement(response.body, batch.batchId, batch.recordCount)) throw new Error('metrics batch rejected')
      await this.spool.acknowledge(batch.files)
      this.retryAttempt = 0
      this.requestFlush(0)
    } catch (error) {
      if (error instanceof TelemetryDeniedError) {
        this.stop()
        await this.spool.clear()
        return
      }
      this.requestFlush(retryDelayMs(this.retryAttempt++))
    }
  }

  private async requestJSON(input: string, init: RequestInit) {
    const controller = new AbortController()
    this.requestController = controller
    const timeout = setTimeout(() => controller.abort(), requestTimeoutMs)
    timeout.unref()
    try {
      const response = await fetch(input, { ...init, signal: controller.signal })
      return { ok: response.ok, status: response.status, body: await readJSON(response) }
    } finally {
      clearTimeout(timeout)
      if (this.requestController === controller) this.requestController = undefined
    }
  }

  private acceptsEvents() {
    return this.initialized && this.collecting
  }
}
