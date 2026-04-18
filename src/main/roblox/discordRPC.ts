import { ActivityEvent } from './activityTracker'

// Discord Application ID for Roblox
const CLIENT_ID = '363445589247131668'

let rpcClient: any = null
let connected = false
let enabled = true
let currentActivity: ActivityEvent | null = null

async function connect(): Promise<void> {
  if (connected || !enabled) return
  try {
    const { Client } = await import('@xhayper/discord-rpc')
    rpcClient = new Client({ clientId: CLIENT_ID })

    rpcClient.on('ready', () => {
      connected = true
      console.log('[DiscordRPC] Connected')
      if (currentActivity) applyActivity(currentActivity)
    })

    rpcClient.on('disconnected', () => {
      connected = false
      console.log('[DiscordRPC] Disconnected')
    })

    await rpcClient.login()
  } catch (err) {
    console.warn('[DiscordRPC] Could not connect:', err)
    connected = false
  }
}

function applyActivity(event: ActivityEvent): void {
  if (!connected || !rpcClient) return
  try {
    if (event.type === 'join') {
      rpcClient.user?.setActivity({
        details: event.placeName ?? 'Playing a game',
        state: `Place ID: ${event.placeId ?? 'Unknown'}`,
        startTimestamp: Math.floor(event.timestamp / 1000),
        largeImageKey: 'roblox_logo',
        largeImageText: 'Roblox',
        smallImageKey: 'appleblox',
        smallImageText: 'via AppleBlox',
        buttons: event.placeId
          ? [
              {
                label: 'View Game',
                url: `https://www.roblox.com/games/${event.placeId}`
              }
            ]
          : undefined
      })
    } else {
      rpcClient.user?.setActivity({
        details: 'In the app',
        state: 'Launched with AppleBlox',
        largeImageKey: 'roblox_logo',
        largeImageText: 'Roblox',
        smallImageKey: 'appleblox',
        smallImageText: 'via AppleBlox'
      })
    }
  } catch (err) {
    console.warn('[DiscordRPC] setActivity failed:', err)
  }
}

export const discordRPC = {
  async setEnabled(value: boolean): Promise<void> {
    enabled = value
    if (enabled) {
      await connect()
    } else {
      this.clearActivity()
      rpcClient?.destroy?.()
      connected = false
      rpcClient = null
    }
  },

  getStatus(): { connected: boolean; enabled: boolean; currentGame?: string } {
    return {
      connected,
      enabled,
      currentGame: currentActivity?.type === 'join' ? currentActivity.placeName : undefined
    }
  },

  async updateActivity(event: ActivityEvent): Promise<void> {
    if (!enabled) return
    currentActivity = event
    if (!connected) {
      await connect()
    } else {
      applyActivity(event)
    }
  },

  clearActivity(): void {
    currentActivity = null
    if (connected && rpcClient) {
      try {
        rpcClient.user?.clearActivity()
      } catch {}
    }
  },

  async init(isEnabled: boolean): Promise<void> {
    enabled = isEnabled
    if (enabled) await connect()
  }
}
