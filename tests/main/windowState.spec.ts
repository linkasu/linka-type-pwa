import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { readWindowState, writeWindowState } from '../../electron/windowState'

let userDataPath = ''

afterEach(async () => {
  if (userDataPath) await rm(userDataPath, { recursive: true, force: true })
  userDataPath = ''
})

describe('window state storage', () => {
  it('persists the normal bounds and maximized state', async () => {
    userDataPath = await mkdtemp(path.join(os.tmpdir(), 'linka-window-state-'))
    const state = {
      bounds: { x: 100, y: 50, width: 800, height: 600 },
      isMaximized: true,
    }

    writeWindowState(userDataPath, state)

    expect(readWindowState(userDataPath)).toEqual(state)
  })

  it('ignores a missing state file', async () => {
    userDataPath = await mkdtemp(path.join(os.tmpdir(), 'linka-window-state-'))

    expect(readWindowState(userDataPath)).toBeUndefined()
  })
})
