import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  roblox: {
    isInstalled: (): Promise<boolean> => ipcRenderer.invoke('roblox:isInstalled'),
    getVersion: (): Promise<string | null> => ipcRenderer.invoke('roblox:getVersion'),
    install: (): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('roblox:install'),
    launch: (opts?: {
      url?: string
      args?: string[]
    }): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('roblox:launch', opts),
    checkUpdate: (): Promise<{ hasUpdate: boolean; latestVersion?: string }> =>
      ipcRenderer.invoke('roblox:checkUpdate'),
    onActivityEvent: (cb: (event: any) => void) => {
      ipcRenderer.on('activity:event', (_, event) => cb(event))
    }
  },

  fastFlags: {
    get: (): Promise<Record<string, any>> => ipcRenderer.invoke('fastflags:get'),
    set: (flags: Record<string, any>): Promise<void> =>
      ipcRenderer.invoke('fastflags:set', flags),
    reset: (): Promise<void> => ipcRenderer.invoke('fastflags:reset'),
    getPresets: (): Promise<any[]> => ipcRenderer.invoke('fastflags:getPresets'),
    applyPreset: (id: string): Promise<Record<string, any>> =>
      ipcRenderer.invoke('fastflags:applyPreset', id)
  },

  activity: {
    getHistory: (): Promise<any[]> => ipcRenderer.invoke('activity:getHistory'),
    getStats: (): Promise<any> => ipcRenderer.invoke('activity:getStats'),
    onEvent: (cb: (event: any) => void) => {
      ipcRenderer.on('activity:event', (_, event) => cb(event))
    }
  },

  discord: {
    getStatus: (): Promise<any> => ipcRenderer.invoke('discord:getStatus'),
    setEnabled: (enabled: boolean): Promise<void> =>
      ipcRenderer.invoke('discord:setEnabled', enabled)
  },

  settings: {
    get: (key: string): Promise<any> => ipcRenderer.invoke('settings:get', key),
    getAll: (): Promise<Record<string, any>> => ipcRenderer.invoke('settings:getAll'),
    set: (key: string, value: any): Promise<void> =>
      ipcRenderer.invoke('settings:set', key, value),
    reset: (): Promise<Record<string, any>> => ipcRenderer.invoke('settings:reset')
  },

  app: {
    getVersion: (): Promise<string> => ipcRenderer.invoke('app:getVersion'),
    openExternal: (url: string): Promise<void> =>
      ipcRenderer.invoke('app:openExternal', url),
    quit: (): Promise<void> => ipcRenderer.invoke('app:quit')
  }
})
