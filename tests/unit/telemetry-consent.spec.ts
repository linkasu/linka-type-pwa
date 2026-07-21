import { createAnalyticsService } from '~/composables/analytics/service'
import { ANALYTICS_CONSENT } from '~/types/analytics'

describe('telemetry consent bridge', () => {
  it('starts unknown and does not treat legacy Firebase consent as a V3 grant', async () => {
    const getTelemetryPreference = vi.fn(async () => 'unknown' as const)
    const recordOutcome = vi.fn()
    vi.stubGlobal('window', { desktop: { privacy: { getTelemetryPreference, setTelemetryPreference: vi.fn(), recordOutcome } } })

    const telemetry = createAnalyticsService()
    await telemetry.initialize()
    telemetry.track({ kind: 'phrase_composed', source: 'input', count_bucket: 'one' })

    expect(telemetry.state.value).toBe(ANALYTICS_CONSENT.Unknown)
    expect(getTelemetryPreference).toHaveBeenCalledOnce()
    expect(recordOutcome).not.toHaveBeenCalled()
  })

  it('sends a closed outcome only after the main process persists enabled consent', async () => {
    const setTelemetryPreference = vi.fn(async () => 'enabled' as const)
    const recordOutcome = vi.fn()
    vi.stubGlobal('window', { desktop: { privacy: { getTelemetryPreference: vi.fn(async () => 'unknown' as const), setTelemetryPreference, recordOutcome } } })

    const telemetry = createAnalyticsService()
    await telemetry.setConsent(ANALYTICS_CONSENT.Enabled)
    telemetry.track({ kind: 'phrase_composed', source: 'quick', count_bucket: 'one' })

    expect(setTelemetryPreference).toHaveBeenCalledWith('enabled')
    expect(recordOutcome).toHaveBeenCalledWith({ kind: 'phrase_composed', source: 'quick', count_bucket: 'one' })
  })
})
