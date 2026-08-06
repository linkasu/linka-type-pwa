import { readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type { WindowState } from './windowBounds.js'

const WINDOW_STATE_FILE = 'window-state.json'

export const getWindowStatePath = (userDataPath: string): string =>
  path.join(userDataPath, WINDOW_STATE_FILE)

export const readWindowState = (userDataPath: string): unknown => {
  try {
    return JSON.parse(readFileSync(getWindowStatePath(userDataPath), 'utf8'))
  } catch {
    return undefined
  }
}

export const writeWindowState = (userDataPath: string, state: WindowState): void => {
  const targetPath = getWindowStatePath(userDataPath)
  const temporaryPath = `${targetPath}.tmp`

  try {
    writeFileSync(temporaryPath, JSON.stringify(state), 'utf8')
    renameSync(temporaryPath, targetPath)
  } catch {
    // Window restoration is a convenience and must never prevent startup or exit.
  }
}
