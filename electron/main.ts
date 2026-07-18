import { app, BrowserWindow, ipcMain, session, shell, systemPreferences } from 'electron'
import updater from 'electron-updater'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { registerBackendRequestIpc } from './backendRequest.js'
import {
  AnalyticsNetworkPolicy,
  registerAnalyticsNetworkGuard,
} from './privacyNetwork.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isDev = !app.isPackaged
const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://127.0.0.1:5173'

let mainWindow: BrowserWindow | null = null
const { autoUpdater } = updater
const analyticsNetworkPolicy = new AnalyticsNetworkPolicy()

type MediaAccessStatus = 'not-determined' | 'granted' | 'denied' | 'restricted' | 'unknown'

const sendUpdateStatus = (payload: Record<string, unknown>) => {
  if (!mainWindow || mainWindow.isDestroyed()) return
  mainWindow.webContents.send('updates:status', payload)
}

const configureAutoUpdater = () => {
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => {
    sendUpdateStatus({ state: 'checking' })
  })

  autoUpdater.on('update-available', info => {
    sendUpdateStatus({ state: 'available', info })
  })

  autoUpdater.on('update-not-available', info => {
    sendUpdateStatus({ state: 'idle', info })
  })

  autoUpdater.on('download-progress', progress => {
    sendUpdateStatus({ state: 'downloading', progress })
  })

  autoUpdater.on('update-downloaded', info => {
    sendUpdateStatus({ state: 'downloaded', info })
  })

  autoUpdater.on('error', error => {
    sendUpdateStatus({
      state: 'error',
      message: error == null ? 'Unknown updater error' : String(error),
    })
  })
}

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    title: 'LINKa: напиши',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: false,
    },
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev) {
    await mainWindow.loadURL(`${devServerUrl}/app.html#/login`)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../renderer/app.html'), {
      hash: '/login',
    })
  }
}

const registerUpdateIpc = () => {
  ipcMain.handle('updates:check', async () => {
    try {
      const result = await autoUpdater.checkForUpdates()
      return { ok: true, info: result?.updateInfo ?? null }
    } catch (error) {
      return {
        ok: false,
        message: error == null ? 'Failed to check updates' : String(error),
      }
    }
  })

  ipcMain.handle('updates:download', async () => {
    try {
      await autoUpdater.downloadUpdate()
      return { ok: true }
    } catch (error) {
      return {
        ok: false,
        message: error == null ? 'Failed to download update' : String(error),
      }
    }
  })

  ipcMain.handle('updates:install', () => {
    autoUpdater.quitAndInstall()
  })
}

const registerMediaIpc = () => {
  ipcMain.handle('media:ensure-microphone-access', async () => {
    if (process.platform !== 'darwin') {
      return {
        granted: true,
        status: 'granted' as MediaAccessStatus,
        needsSystemSettings: false,
      }
    }

    let status = systemPreferences.getMediaAccessStatus('microphone') as MediaAccessStatus

    if (status === 'not-determined') {
      const granted = await systemPreferences.askForMediaAccess('microphone')
      status = systemPreferences.getMediaAccessStatus('microphone') as MediaAccessStatus

      return {
        granted,
        status,
        needsSystemSettings: !granted && (status === 'denied' || status === 'restricted'),
      }
    }

    return {
      granted: status === 'granted',
      status,
      needsSystemSettings: status === 'denied' || status === 'restricted',
    }
  })
}

const registerIpc = () => {
  ipcMain.handle('app:get-version', () => app.getVersion())
  ipcMain.handle('app:get-platform', () => process.platform)
  ipcMain.handle('privacy:set-analytics-enabled', (event, enabled: unknown) => {
    if (event.sender !== mainWindow?.webContents || typeof enabled !== 'boolean') {
      return false
    }
    analyticsNetworkPolicy.setEnabled(enabled)
    return true
  })
  registerUpdateIpc()
  registerMediaIpc()
  registerBackendRequestIpc()
}

app.whenReady().then(async () => {
  registerAnalyticsNetworkGuard(session.defaultSession, analyticsNetworkPolicy)
  registerIpc()
  configureAutoUpdater()
  await createWindow()

  if (!isDev) {
    void autoUpdater.checkForUpdates().catch((): undefined => undefined)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
