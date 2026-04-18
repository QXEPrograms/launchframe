export type Page = 'home' | 'fastflags' | 'integrations' | 'behavior' | 'settings'

export interface FastFlagPreset {
  id: string
  name: string
  description: string
  category: 'performance' | 'graphics' | 'ui' | 'misc'
  flags: Record<string, string | number | boolean>
}

export interface SessionRecord {
  placeId: string
  placeName: string
  startTime: number
  endTime?: number
  duration?: number
}

export interface ActivityEvent {
  type: 'join' | 'leave'
  placeId?: string
  placeName?: string
  timestamp: number
}

export interface Settings {
  'discord.enabled': boolean
  'discord.showPlaceName': boolean
  'discord.showElapsed': boolean
  'discord.webhookUrl': string
  'behavior.launchOnStartup': boolean
  'behavior.closeToTray': boolean
  'behavior.multiInstance': boolean
  'behavior.customArgs': string
  'appearance.theme': 'system' | 'light' | 'dark'
}

// Augment window with our bridge API
declare global {
  interface Window {
    api: {
      roblox: {
        isInstalled: () => Promise<boolean>
        getVersion: () => Promise<string | null>
        install: () => Promise<{ success: boolean; error?: string }>
        launch: (opts?: { url?: string; args?: string[] }) => Promise<{ success: boolean; error?: string }>
        checkUpdate: () => Promise<{ hasUpdate: boolean; latestVersion?: string }>
        onActivityEvent: (cb: (event: ActivityEvent) => void) => void
      }
      fastFlags: {
        get: () => Promise<Record<string, any>>
        set: (flags: Record<string, any>) => Promise<void>
        reset: () => Promise<void>
        getPresets: () => Promise<FastFlagPreset[]>
        applyPreset: (id: string) => Promise<Record<string, any>>
      }
      activity: {
        getHistory: () => Promise<SessionRecord[]>
        getStats: () => Promise<{ totalPlaytime: number; sessionCount: number; currentSession: SessionRecord | null }>
        onEvent: (cb: (event: ActivityEvent) => void) => void
      }
      discord: {
        getStatus: () => Promise<{ connected: boolean; enabled: boolean; currentGame?: string }>
        setEnabled: (enabled: boolean) => Promise<void>
      }
      settings: {
        get: (key: string) => Promise<any>
        getAll: () => Promise<Record<string, any>>
        set: (key: string, value: any) => Promise<void>
        reset: () => Promise<Record<string, any>>
      }
      app: {
        getVersion: () => Promise<string>
        openExternal: (url: string) => Promise<void>
        quit: () => Promise<void>
      }
    }
  }
}
