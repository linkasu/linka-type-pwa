import { app, BrowserWindow, ipcMain, shell } from 'electron'
import updater from 'electron-updater'
import { Buffer } from 'node:buffer'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isDev = !app.isPackaged
const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://127.0.0.1:5173'

let mainWindow: BrowserWindow | null = null
const { autoUpdater } = updater

type BackendFormDataEntry =
  | {
    kind: 'text'
    name: string
    value: string
  }
  | {
    kind: 'file'
    name: string
    filename?: string
    contentType?: string
    base64: string
  }

type BackendBodyPayload =
  | { kind: 'json'; value: unknown }
  | { kind: 'text'; value: string }
  | { kind: 'binary'; base64: string; contentType?: string }
  | { kind: 'form-data'; entries: BackendFormDataEntry[] }

type BackendRequestPayload = {
  url: string
  method?: string
  headers?: Record<string, string>
  body?: BackendBodyPayload | null
  responseType?: 'json' | 'text' | 'arraybuffer'
}

type BackendResponsePayload = {
  ok: boolean
  status: number
  statusText: string
  headers: Record<string, string>
  dataType: 'json' | 'text' | 'base64'
  data: unknown
}

type BackendRequestBody = string | Buffer | FormData | undefined

function headersToObject(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {}
  headers.forEach((value, key) => {
    result[key] = value
  })
  return result
}

function buildRequestBody(body?: BackendBodyPayload | null): BackendRequestBody {
  if (!body) return undefined

  if (body.kind === 'json') {
    return JSON.stringify(body.value)
  }

  if (body.kind === 'text') {
    return body.value
  }

  if (body.kind === 'binary') {
    return Buffer.from(body.base64, 'base64')
  }

  const form = new FormData()
  for (const entry of body.entries) {
    if (entry.kind === 'text') {
      form.append(entry.name, entry.value)
      continue
    }

    const buffer = Buffer.from(entry.base64, 'base64')
    const blob = new Blob([buffer], {
      type: entry.contentType || 'application/octet-stream',
    })
    form.append(entry.name, blob, entry.filename || 'file')
  }
  return form
}

async function performBackendRequest(
  payload: BackendRequestPayload,
): Promise<BackendResponsePayload> {
  const method = String(payload.method || 'GET').toUpperCase()
  const headers = { ...(payload.headers || {}) }
  const body = buildRequestBody(payload.body)

  if (payload.body?.kind === 'json' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  // Browser sets multipart boundary automatically; keep header empty for form-data.
  if (payload.body?.kind === 'form-data') {
    delete headers['Content-Type']
    delete headers['content-type']
  }

  const response = await fetch(payload.url, {
    method,
    headers,
    body: method === 'GET' || method === 'HEAD' ? undefined : body,
  })

  const responseHeaders = headersToObject(response.headers)
  const contentType = response.headers.get('content-type') || ''
  const wantsArrayBuffer = payload.responseType === 'arraybuffer'
  const wantsText = payload.responseType === 'text'

  if (wantsArrayBuffer) {
    const bytes = new Uint8Array(await response.arrayBuffer())
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      dataType: 'base64',
      data: Buffer.from(bytes).toString('base64'),
    }
  }

  if (!wantsText && contentType.includes('application/json')) {
    const data = await response.json().catch(() => null)
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      dataType: 'json',
      data,
    }
  }

  const text = await response.text()
  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
    dataType: 'text',
    data: text,
  }
}

function sendUpdateStatus(payload: Record<string, unknown>) {
  if (!mainWindow || mainWindow.isDestroyed()) return
  mainWindow.webContents.send('updates:status', payload)
}

function configureAutoUpdater() {
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => {
    sendUpdateStatus({ state: 'checking' })
  })

  autoUpdater.on('update-available', (info) => {
    sendUpdateStatus({ state: 'available', info })
  })

  autoUpdater.on('update-not-available', (info) => {
    sendUpdateStatus({ state: 'idle', info })
  })

  autoUpdater.on('download-progress', (progress) => {
    sendUpdateStatus({ state: 'downloading', progress })
  })

  autoUpdater.on('update-downloaded', (info) => {
    sendUpdateStatus({ state: 'downloaded', info })
  })

  autoUpdater.on('error', (error) => {
    sendUpdateStatus({
      state: 'error',
      message: error == null ? 'Unknown updater error' : String(error),
    })
  })
}

async function createWindow() {
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

function registerIpc() {
  ipcMain.handle('app:get-version', () => app.getVersion())
  ipcMain.handle('app:get-platform', () => process.platform)

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

  ipcMain.handle('backend:request', async (_event, payload: BackendRequestPayload) => {
    try {
      return await performBackendRequest(payload)
    } catch (error) {
      return {
        ok: false,
        status: 0,
        statusText: 'NETWORK_ERROR',
        headers: {},
        dataType: 'text',
        data: error == null ? 'Backend request failed' : String(error),
      } satisfies BackendResponsePayload
    }
  })
}

app.whenReady().then(async () => {
  registerIpc()
  configureAutoUpdater()
  await createWindow()

  if (!isDev) {
    void autoUpdater.checkForUpdates().catch(() => undefined)
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
