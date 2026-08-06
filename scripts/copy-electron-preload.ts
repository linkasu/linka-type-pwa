import { copyFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

copyFileSync(
  path.join(root, 'electron/preload.cjs'),
  path.join(root, 'dist/electron/preload.cjs'),
)
