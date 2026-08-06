import { describe, expect, it } from 'vitest'
import {
  MIN_WINDOW_HEIGHT,
  MIN_WINDOW_WIDTH,
  getInitialWindowBounds,
  resolveWindowState,
} from '../../electron/windowBounds'

const primaryDisplay = { x: 0, y: 0, width: 1280, height: 720 }

describe('window bounds', () => {
  it('fits the first launch window into the available work area', () => {
    expect(getInitialWindowBounds(primaryDisplay)).toEqual({
      x: 0,
      y: 0,
      width: 1280,
      height: 720,
    })
  })

  it('restores saved bounds that are still visible on a display', () => {
    expect(resolveWindowState({
      bounds: { x: 100, y: 50, width: 800, height: 600 },
      isMaximized: false,
    }, [primaryDisplay])).toEqual({
      bounds: { x: 100, y: 50, width: 800, height: 600 },
      isMaximized: false,
    })
  })

  it('moves a window from a disconnected display onto the primary display', () => {
    expect(resolveWindowState({
      bounds: { x: 2200, y: 50, width: 800, height: 600 },
      isMaximized: true,
    }, [primaryDisplay])).toEqual({
      bounds: { x: 240, y: 60, width: 800, height: 600 },
      isMaximized: true,
    })
  })

  it('shrinks oversized restored bounds to the current display', () => {
    expect(resolveWindowState({
      bounds: { x: -100, y: -100, width: 1400, height: 900 },
      isMaximized: false,
    }, [primaryDisplay])).toEqual({
      bounds: { x: 0, y: 0, width: 1280, height: 720 },
      isMaximized: false,
    })
  })

  it('ignores malformed saved state and starts safely', () => {
    expect(resolveWindowState({ bounds: { width: 'wide' } }, [primaryDisplay])).toEqual({
      bounds: { x: 0, y: 0, width: 1280, height: 720 },
      isMaximized: false,
    })
  })

  it('uses the supported minimum when no display information is available', () => {
    expect(resolveWindowState(undefined, [])).toEqual({
      bounds: { x: 0, y: 0, width: MIN_WINDOW_WIDTH, height: MIN_WINDOW_HEIGHT },
      isMaximized: false,
    })
  })
})
