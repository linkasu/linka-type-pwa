import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { TelemetryPreferenceStore } from '../../electron/telemetry/privacy'

describe('V3 telemetry preference store', () => {
  it('does not accept a legacy Firebase-style grant', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'linka-type-telemetry-'))
    try {
      await writeFile(join(directory, 'telemetry-consent-v3.json'), JSON.stringify({ telemetry: 'granted' }))

      await expect(new TelemetryPreferenceStore(directory).read()).resolves.toBe('unknown')
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })
})
