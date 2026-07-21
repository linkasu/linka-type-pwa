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
    getTelemetryPreference: () => ipcRenderer.invoke('telemetry:get-preference'),
    setTelemetryPreference: (preference) => ipcRenderer.invoke('telemetry:set-preference', preference),
    recordOutcome: (outcome) => ipcRenderer.send('telemetry:outcome', outcome),
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
