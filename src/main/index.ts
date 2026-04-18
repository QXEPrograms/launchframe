import {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  Tray,
  Menu,
  nativeImage
} from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { bootstrapper } from './roblox/bootstrapper'
import { fastFlagsManager } from './roblox/fastflags'
import { activityTracker } from './roblox/activityTracker'
import { discordRPC } from './roblox/discordRPC'

// ← Must be set before app.whenReady() — controls what appears in the
//   macOS menu bar, dock tooltip, and Activity Monitor.
app.name = 'LaunchFrame'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

// ─── Settings ────────────────────────────────────────────────────────────────

const settingsPath = () => join(app.getPath('userData'), 'settings.json')

const defaultSettings = {
  'discord.enabled': true,
  'discord.showPlaceName': true,
  'discord.showElapsed': true,
  'discord.webhookUrl': '',
  'behavior.launchOnStartup': false,
  'behavior.closeToTray': true,
  'behavior.multiInstance': false,
  'behavior.customArgs': '',
  'appearance.theme': 'system'
}

let settings: Record<string, any> = { ...defaultSettings }

function loadSettings(): void {
  const p = settingsPath()
  if (existsSync(p)) {
    try {
      const saved = JSON.parse(readFileSync(p, 'utf-8'))
      settings = { ...defaultSettings, ...saved }
    } catch {}
  }
}

function saveSettings(): void {
  const dir = app.getPath('userData')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(settingsPath(), JSON.stringify(settings, null, 2))
}

// ─── Window ───────────────────────────────────────────────────────────────────

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 640,
    minWidth: 820,
    minHeight: 560,
    show: false,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 18, y: 20 },
    vibrancy: 'under-window',
    visualEffectState: 'active',
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  mainWindow.on('close', (e) => {
    if (settings['behavior.closeToTray']) {
      e.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Allow Firebase / Google OAuth popups to open as child windows
    const isAuthUrl =
      url.includes('accounts.google.com') ||
      url.includes('firebaseapp.com') ||
      url.includes('/__/auth/')

    if (isAuthUrl) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 600,
          height: 700,
          titleBarStyle: 'default',
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true
          }
        }
      }
    }

    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ─── Tray ─────────────────────────────────────────────────────────────────────

function createTray(): void {
  // Use a template image (macOS auto-inverts for dark mode)
  const icon = nativeImage
    .createFromPath(join(__dirname, '../../resources/tray-icon.png'))
    .resize({ width: 18, height: 18 })
  icon.setTemplateImage(true)

  tray = new Tray(icon)
  tray.setToolTip('LaunchFrame')

  const menu = Menu.buildFromTemplate([
    {
      label: 'Open LaunchFrame',
      click: () => {
        mainWindow?.show()
        mainWindow?.focus()
      }
    },
    {
      label: 'Launch Roblox',
      click: () => bootstrapper.launchRoblox()
    },
    { type: 'separator' },
    { label: `LaunchFrame v${app.getVersion()}`, enabled: false },
    { type: 'separator' },
    {
      label: 'Quit LaunchFrame',
      click: () => {
        mainWindow?.destroy()
        app.quit()
      }
    }
  ])

  tray.setContextMenu(menu)
  tray.on('click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.focus()
    } else {
      mainWindow?.show()
    }
  })
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

function registerIPC(): void {
  // Bootstrapper
  ipcMain.handle('roblox:isInstalled', () => bootstrapper.isInstalled())
  ipcMain.handle('roblox:getVersion', () => bootstrapper.getRobloxVersion())
  ipcMain.handle('roblox:install', () => bootstrapper.installRoblox())
  ipcMain.handle('roblox:launch', (_, opts) => bootstrapper.launchRoblox(opts))
  ipcMain.handle('roblox:checkUpdate', () => bootstrapper.checkForRobloxUpdate())

  // Fast Flags
  ipcMain.handle('fastflags:get', () => fastFlagsManager.getFlags())
  ipcMain.handle('fastflags:set', (_, flags) => fastFlagsManager.setFlags(flags))
  ipcMain.handle('fastflags:reset', () => fastFlagsManager.resetFlags())
  ipcMain.handle('fastflags:getPresets', () => fastFlagsManager.getPresets())
  ipcMain.handle('fastflags:applyPreset', (_, id) => fastFlagsManager.applyPreset(id))

  // Activity
  ipcMain.handle('activity:getHistory', () => activityTracker.getHistory())
  ipcMain.handle('activity:getStats', () => activityTracker.getStats())

  // Discord RPC
  ipcMain.handle('discord:getStatus', () => discordRPC.getStatus())
  ipcMain.handle('discord:setEnabled', async (_, enabled: boolean) => {
    settings['discord.enabled'] = enabled
    saveSettings()
    await discordRPC.setEnabled(enabled)
  })

  // Settings
  ipcMain.handle('settings:get', (_, key: string) => settings[key])
  ipcMain.handle('settings:getAll', () => settings)
  ipcMain.handle('settings:set', (_, key: string, value: any) => {
    settings[key] = value
    saveSettings()

    // Apply side-effects
    if (key === 'behavior.launchOnStartup') {
      app.setLoginItemSettings({ openAtLogin: value })
    }
  })
  ipcMain.handle('settings:reset', () => {
    settings = { ...defaultSettings }
    saveSettings()
    return settings
  })

  // App
  ipcMain.handle('app:getVersion', () => app.getVersion())
  ipcMain.handle('app:openExternal', (_, url: string) => shell.openExternal(url))
  ipcMain.handle('app:quit', () => {
    mainWindow?.destroy()
    app.quit()
  })
  ipcMain.handle('app:showWindow', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  loadSettings()
  registerIPC()
  createWindow()
  createTray()

  // Start activity tracker
  activityTracker.startWatching((event) => {
    mainWindow?.webContents.send('activity:event', event)
    if (settings['discord.enabled']) {
      discordRPC.updateActivity(event)
    }
  })

  // Init Discord RPC
  await discordRPC.init(settings['discord.enabled'])

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else {
      mainWindow?.show()
    }
  })
})

app.on('window-all-closed', () => {
  // Keep running in tray on macOS — don't quit
})

app.on('before-quit', () => {
  activityTracker.stopWatching()
  discordRPC.clearActivity()
})
