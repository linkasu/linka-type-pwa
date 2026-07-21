import { sanitizeTelemetryOutcome } from '../../electron/telemetry/sanitize'

describe('telemetry outcome sanitizer', () => {
  it('accepts only registered outcome fields', () => {
    expect(sanitizeTelemetryOutcome({
      kind: 'speech_completed',
      result: 'completed',
      source: 'input',
      mode: 'local',
      count_bucket: 'one',
      duration_bucket: 'under_5s',
    })).toEqual({
      kind: 'speech_completed',
      result: 'completed',
      source: 'input',
      mode: 'local',
      count_bucket: 'one',
      duration_bucket: 'under_5s',
    })
  })

  it.each([
    { kind: 'phrase_composed', source: 'input', count_bucket: 'one', text: 'private phrase' },
    { kind: 'phrase_composed', source: 'input', count_bucket: 'one', category: 'personal' },
    { kind: 'speech_completed', result: 'completed', source: 'input', mode: 'local', count_bucket: 'one', duration_bucket: 'under_5s', metadata: { ui: 'private' } },
    { kind: 'unknown', source: 'input', count_bucket: 'one' },
  ])('rejects free or unregistered metadata', input => {
    expect(sanitizeTelemetryOutcome(input)).toBeUndefined()
  })
})
