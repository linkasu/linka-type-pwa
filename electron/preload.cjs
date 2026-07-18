const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('desktop', {
  app: {
    getVersion: () => ipcRenderer.invoke('app:get-version'),
    getPlatform: () => ipcRenderer.invoke('app:get-platform'),
  },
  media: {
    ensureMicrophoneAccess: () => ipcRenderer.invoke('media:ensure-microphone-access'),
  },
  privacy: {
    setAnalyticsEnabled: (enabled) => ipcRenderer.invoke('privacy:set-analytics-enabled', enabled),
  },
  updates: {
    check: () => ipcRenderer.invoke('updates:check'),
    download: () => ipcRenderer.invoke('updates:download'),
    install: () => ipcRenderer.invoke('updates:install'),
    onStatus: (callback) => {
      const listener = (_event, payload) => callback(payload)
      ipcRenderer.on('updates:status', listener)
      return () => {
        ipcRenderer.removeListener('updates:status', listener)
      }
    },
  },
  backend: {
    request: (payload) => ipcRenderer.invoke('backend:request', payload),
  },
})
