import { ipcMain, systemPreferences } from 'electron'

type MediaAccessStatus = 'not-determined' | 'granted' | 'denied' | 'restricted' | 'unknown'

export function registerMediaIpc() {
  ipcMain.handle('media:ensure-microphone-access', async () => {
    if (process.platform !== 'darwin') return { granted: true, status: 'granted' as MediaAccessStatus, needsSystemSettings: false }

    let status = systemPreferences.getMediaAccessStatus('microphone') as MediaAccessStatus
    if (status === 'not-determined') {
      const granted = await systemPreferences.askForMediaAccess('microphone')
      status = systemPreferences.getMediaAccessStatus('microphone') as MediaAccessStatus
      return { granted, status, needsSystemSettings: !granted && (status === 'denied' || status === 'restricted') }
    }
    return { granted: status === 'granted', status, needsSystemSettings: status === 'denied' || status === 'restricted' }
  })
}
