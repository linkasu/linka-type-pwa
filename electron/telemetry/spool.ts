import { randomUUID } from 'node:crypto'
import { chmod, mkdir, open, readFile, readdir, rename, rm, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { isValidActiveBatch, isValidSpoolRecord } from './spoolValidation.js'
import type { SpoolRecord, StoredOutcome } from './types.js'

const recordSuffix = '.outcome.json'
const activeBatchFile = 'active-batch.json'
const maximumRecordAgeMs = 30 * 24 * 60 * 60 * 1000

export interface SpoolBatch {
  batchId: string
  body: string
  files: string[]
  recordCount: number
}

interface StoredBatch extends SpoolBatch {
  subjectKey: string
  sentAt: string
}

export class FileTelemetrySpool {
  private operation = Promise.resolve()
  private totalBytes?: number

  constructor(private readonly directory: string, private readonly capacityBytes = 20 * 1024 * 1024) {}

  initialize() {
    return this.exclusive(async () => {
      await mkdir(this.directory, { recursive: true, mode: 0o700 })
      await chmod(this.directory, 0o700)
      const entries = await readdir(this.directory)
      await Promise.all(entries.filter(name => name.endsWith('.tmp')).map(name => rm(join(this.directory, name), { force: true })))
      this.totalBytes = await this.calculateBytes()
    })
  }

  enqueue(record: SpoolRecord) {
    return this.exclusive(async () => {
      await mkdir(this.directory, { recursive: true, mode: 0o700 })
      const contents = JSON.stringify(record)
      const fileName = `${String(record.created_at).padStart(13, '0')}-${randomUUID()}${recordSuffix}`
      await this.atomicWrite(fileName, contents)
      if (this.totalBytes === undefined) this.totalBytes = await this.calculateBytes()
      else this.totalBytes += Buffer.byteLength(contents, 'utf8')
      await this.enforceCapacity()
    })
  }

  getBatch(subjectKey: string, maxRecords = 500, maxBytes = 512 * 1024) {
    return this.exclusive(async (): Promise<SpoolBatch | undefined> => {
      const active = await this.readActiveBatch(subjectKey)
      if (active) return active
      const selected: string[] = []
      const records: StoredOutcome[] = []
      const batchId = randomUUID()
      const sentAt = new Date().toISOString()
      const files = (await readdir(this.directory)).filter(name => name.endsWith(recordSuffix)).sort()

      for (const file of files) {
        if (selected.length >= maxRecords) break
        const record = await this.readRecord(file)
        if (!record) continue
        if (Date.parse(record.payload.occurred_at) < Date.now() - maximumRecordAgeMs) {
          await this.remove([file])
          continue
        }
        const body = JSON.stringify(createBatch(batchId, subjectKey, sentAt, [...records, record.payload]))
        if (Buffer.byteLength(body, 'utf8') > maxBytes) {
          if (records.length > 0) break
          await this.remove([file])
          continue
        }
        selected.push(file)
        records.push(record.payload)
      }
      if (selected.length === 0) return undefined
      const batch: StoredBatch = {
        batchId,
        body: JSON.stringify(createBatch(batchId, subjectKey, sentAt, records)),
        files: selected,
        recordCount: selected.length,
        subjectKey,
        sentAt,
      }
      await this.atomicWrite(activeBatchFile, JSON.stringify(batch))
      return batch
    })
  }

  acknowledge(files: string[]) {
    return this.exclusive(async () => {
      await this.remove(files)
      await rm(join(this.directory, activeBatchFile), { force: true })
    })
  }

  releaseBatch() {
    return this.exclusive(() => rm(join(this.directory, activeBatchFile), { force: true }))
  }

  clear() {
    return this.exclusive(async () => {
      await rm(this.directory, { recursive: true, force: true })
      this.totalBytes = 0
    })
  }

  private exclusive<T>(task: () => Promise<T>) {
    const result = this.operation.then(task, task)
    this.operation = result.then((): undefined => undefined, (): undefined => undefined)
    return result
  }

  private async readRecord(fileName: string): Promise<SpoolRecord | undefined> {
    try {
      const record = JSON.parse(await readFile(join(this.directory, fileName), 'utf8')) as unknown
      if (!isValidSpoolRecord(record)) throw new Error('invalid telemetry spool record')
      return record
    } catch {
      await this.remove([fileName])
      return undefined
    }
  }

  private async readActiveBatch(subjectKey: string): Promise<SpoolBatch | undefined> {
    try {
      const batch = JSON.parse(await readFile(join(this.directory, activeBatchFile), 'utf8')) as Partial<StoredBatch>
      if (!isValidActiveBatch(batch, subjectKey, recordSuffix)) throw new Error('invalid active telemetry batch')
      return { batchId: batch.batchId, body: batch.body, files: batch.files, recordCount: batch.recordCount }
    } catch {
      await rm(join(this.directory, activeBatchFile), { force: true })
      return undefined
    }
  }

  private async enforceCapacity() {
    if (this.totalBytes === undefined || this.totalBytes <= this.capacityBytes) return
    const files = (await readdir(this.directory)).filter(name => name.endsWith(recordSuffix)).sort()
    for (const file of files) {
      if (this.totalBytes <= this.capacityBytes) break
      await this.remove([file])
    }
  }

  private async remove(files: string[]) {
    for (const file of files) {
      const size = await this.fileSize(file)
      await rm(join(this.directory, file), { force: true })
      if (this.totalBytes !== undefined) this.totalBytes = Math.max(0, this.totalBytes - size)
    }
  }

  private async calculateBytes() {
    const files = (await readdir(this.directory)).filter(name => name.endsWith(recordSuffix))
    const sizes = await Promise.all(files.map(file => this.fileSize(file)))
    return sizes.reduce((total, size) => total + size, 0)
  }

  private async fileSize(file: string) {
    try {
      return (await stat(join(this.directory, file))).size
    } catch {
      return 0
    }
  }

  private async atomicWrite(fileName: string, contents: string) {
    const target = join(this.directory, fileName)
    const temporary = `${target}.${randomUUID()}.tmp`
    const file = await open(temporary, 'wx', 0o600)
    try {
      await file.writeFile(contents, 'utf8')
      await file.sync()
    } finally {
      await file.close()
    }
    await rename(temporary, target)
    await chmod(target, 0o600)
  }
}

function createBatch(batchId: string, subjectKey: string, sentAt: string, records: StoredOutcome[]) {
  return {
    schema_version: 2,
    batch_id: batchId,
    scope: { product: 'linka-type', subject_key: subjectKey },
    stream: 'outcome',
    sent_at: sentAt,
    records,
  }
}
