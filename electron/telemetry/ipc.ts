import { ipcMain, type BrowserWindow } from 'electron'
import { isTelemetryDecision, type TelemetryPrivacyController } from './privacy.js'
import type { TypeMetricsTelemetry } from './index.js'

export function registerTelemetryIpc(
  getWindow: () => BrowserWindow | null,
  getController: () => TelemetryPrivacyController<TypeMetricsTelemetry> | undefined,
) {
  ipcMain.handle('telemetry:get-preference', event => {
    if (event.sender !== getWindow()?.webContents) return 'unknown'
    return getController()?.getPreference() ?? 'unknown'
  })
  ipcMain.handle('telemetry:set-preference', (event, preference: unknown) => {
    const controller = getController()
    if (event.sender !== getWindow()?.webContents || !isTelemetryDecision(preference) || !controller) throw new TypeError('invalid telemetry preference')
    return controller.setPreference(preference)
  })
  ipcMain.on('telemetry:outcome', (event, outcome: unknown) => {
    if (event.sender === getWindow()?.webContents) getController()?.telemetry?.recordRendererOutcome(outcome)
  })
}
