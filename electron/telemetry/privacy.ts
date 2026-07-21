import { randomUUID } from 'node:crypto'
import { chmod, mkdir, open, readFile, rename, rm } from 'node:fs/promises'
import { join } from 'node:path'
import type { TelemetryDecision, TelemetryPreference } from './types.js'

interface TelemetryRuntime {
  initialize: () => Promise<void>
  stop: () => void
  disableAndClear: () => Promise<void>
}

interface PrivacyControllerOptions<Telemetry extends TelemetryRuntime> {
  store: TelemetryPreferenceStore
  canStart: () => boolean
  createTelemetry: () => Telemetry
  clearTelemetryData: (preference: 'unknown' | 'disabled') => Promise<void>
}

export class TelemetryPreferenceStore {
  private readonly path: string

  constructor(private readonly userDataPath: string) {
    this.path = join(userDataPath, 'telemetry-consent-v3.json')
  }

  async read(): Promise<TelemetryPreference> {
    try {
      const value = JSON.parse(await readFile(this.path, 'utf8')) as { telemetry?: unknown }
      return parseTelemetryPreference(value.telemetry)
    } catch {
      return 'unknown'
    }
  }

  async write(preference: TelemetryDecision) {
    await mkdir(this.userDataPath, { recursive: true, mode: 0o700 })
    const temporary = `${this.path}.${randomUUID()}.tmp`
    const file = await open(temporary, 'wx', 0o600)
    try {
      await file.writeFile(JSON.stringify({ telemetry: preference }), 'utf8')
      await file.sync()
    } finally {
      await file.close()
    }
    if (process.platform === 'win32') await rm(this.path, { force: true })
    await rename(temporary, this.path)
    await chmod(this.path, 0o600)
  }
}

export class TelemetryPrivacyController<Telemetry extends TelemetryRuntime> {
  private preference: TelemetryPreference = 'unknown'
  private runtime?: Telemetry
  private transition = Promise.resolve()

  constructor(private readonly options: PrivacyControllerOptions<Telemetry>) {}

  getPreference() {
    return this.preference
  }

  get telemetry() {
    return this.runtime
  }

  initialize() {
    return this.enqueue(async () => {
      this.preference = await this.options.store.read()
      if (this.preference === 'enabled') await this.start()
      else await this.options.clearTelemetryData(this.preference)
      return this.preference
    })
  }

  setPreference(preference: TelemetryDecision) {
    return this.enqueue(async () => {
      if (preference === 'disabled') {
        const runtime = this.runtime
        runtime?.stop()
        await this.options.store.write(preference)
        this.preference = preference
        this.runtime = undefined
        await (runtime?.disableAndClear() ?? this.options.clearTelemetryData('disabled')).catch((): undefined => undefined)
        return preference
      }

      // V3 consent starts with an empty queue. Firebase/localStorage values never grant it.
      await this.options.clearTelemetryData('unknown')
      await this.options.store.write(preference)
      this.preference = preference
      await this.start()
      return preference
    })
  }

  private async start() {
    if (!this.options.canStart() || this.runtime) return
    const telemetry = this.options.createTelemetry()
    this.runtime = telemetry
    try {
      await telemetry.initialize()
    } catch (error) {
      this.runtime = undefined
      throw error
    }
  }

  private enqueue<Result>(operation: () => Promise<Result>) {
    const result = this.transition.then(operation)
    this.transition = result.then((): undefined => undefined, (): undefined => undefined)
    return result
  }
}

export function parseTelemetryPreference(value: unknown): TelemetryPreference {
  return value === 'enabled' || value === 'disabled' ? value : 'unknown'
}

export function isTelemetryDecision(value: unknown): value is TelemetryDecision {
  return value === 'enabled' || value === 'disabled'
}
