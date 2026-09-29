import { getDevRendererUrl, INITIAL_ROUTE_HASH } from '../../electron/startup'

describe('Electron startup route', () => {
  it('opens the renderer at the splash hash', () => {
    expect(INITIAL_ROUTE_HASH).toBe('/')
    expect(getDevRendererUrl('http://127.0.0.1:5173')).toBe('http://127.0.0.1:5173/app.html#/')
  })
})
