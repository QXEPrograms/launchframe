import { existsSync } from 'fs'
import { exec, spawn } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

const ROBLOX_APP = '/Applications/Roblox.app'
const ROBLOX_BINARY = '/Applications/Roblox.app/Contents/MacOS/RobloxPlayer'
const ROBLOX_DOWNLOAD = 'https://setup.rbxcdn.com/mac/RobloxPlayer.dmg'

export const bootstrapper = {
  isInstalled(): boolean {
    return existsSync(ROBLOX_APP)
  },

  async getRobloxVersion(): Promise<string | null> {
    const plistPath = `${ROBLOX_APP}/Contents/Info.plist`
    if (!existsSync(plistPath)) return null
    try {
      const { stdout } = await execAsync(
        `/usr/libexec/PlistBuddy -c "Print CFBundleShortVersionString" "${plistPath}"`
      )
      return stdout.trim()
    } catch {
      return null
    }
  },

  async installRoblox(): Promise<{ success: boolean; error?: string }> {
    try {
      // Open Roblox download page in browser — proper install via browser
      const { shell } = await import('electron')
      await shell.openExternal(ROBLOX_DOWNLOAD)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  },

  async launchRoblox(options?: {
    url?: string
    args?: string[]
    multiInstance?: boolean
  }): Promise<{ success: boolean; error?: string }> {
    if (!this.isInstalled()) {
      return { success: false, error: 'Roblox is not installed.' }
    }

    try {
      if (options?.url) {
        // Launch via URL scheme (game join from web)
        await execAsync(`open "${options.url}"`)
      } else {
        // Launch directly
        const args = options?.args ?? []
        const proc = spawn('open', ['-a', ROBLOX_APP, '--args', ...args], {
          detached: true,
          stdio: 'ignore'
        })
        proc.unref()
      }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  },

  async checkForRobloxUpdate(): Promise<{ hasUpdate: boolean; latestVersion?: string }> {
    try {
      const { stdout } = await execAsync(
        `curl -s https://setup.rbxcdn.com/mac/version`
      )
      const latestVersion = stdout.trim()
      const currentVersion = await this.getRobloxVersion()
      return {
        hasUpdate: currentVersion !== null && currentVersion !== latestVersion,
        latestVersion
      }
    } catch {
      return { hasUpdate: false }
    }
  }
}
