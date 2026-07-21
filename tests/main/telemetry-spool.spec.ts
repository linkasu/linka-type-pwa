import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { FileTelemetrySpool } from '../../electron/telemetry/spool'

describe('durable telemetry spool', () => {
  it('writes an outcome-only V2 batch with an idempotency key', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'linka-type-telemetry-'))
    const spool = new FileTelemetrySpool(directory)
    try {
      const recordId = randomUUID()
      await spool.initialize()
      await spool.enqueue({
        id: recordId,
        created_at: Date.now(),
        payload: {
          record_id: recordId,
          occurred_at: new Date().toISOString(),
          app_session_id: randomUUID(),
          app: { version: '2.0.8', build: '2.0.8', platform: 'macos', os_version: '24.0.0', locale: 'ru' },
          kind: 'phrase_composed',
          source: 'input',
          count_bucket: 'one',
        },
      })

      const batch = await spool.getBatch('074a5e8a5a5b103c9d7057f284eb3418d91870ced0941f9374edefdd78c6a6c8')

      expect(batch).toBeDefined()
      const body = JSON.parse(batch!.body)
      expect(body).toMatchObject({ schema_version: 2, stream: 'outcome', batch_id: batch!.batchId })
      expect(body.records).toEqual([expect.objectContaining({ kind: 'phrase_composed', source: 'input', count_bucket: 'one' })])
      expect(body.records[0]).not.toHaveProperty('text')
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })
})
