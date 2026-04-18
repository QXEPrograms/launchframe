import chokidar from 'chokidar'
import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync } from 'fs'
import { homedir } from 'os'
import path from 'path'
import { app } from 'electron'

const ROBLOX_LOGS_DIR = path.join(homedir(), 'Library', 'Logs', 'Roblox')

export type ActivityEventType = 'join' | 'leave'

export interface ActivityEvent {
  type: ActivityEventType
  placeId?: string
  placeName?: string
  universeId?: string
  timestamp: number
}

export interface SessionRecord {
  placeId: string
  placeName: string
  startTime: number
  endTime?: number
  duration?: number
}

interface StoredData {
  sessions: SessionRecord[]
  totalPlaytime: number
}

function getStoragePath(): string {
  return path.join(app.getPath('userData'), 'activity.json')
}

function loadData(): StoredData {
  const p = getStoragePath()
  if (!existsSync(p)) return { sessions: [], totalPlaytime: 0 }
  try {
    return JSON.parse(readFileSync(p, 'utf-8'))
  } catch {
    return { sessions: [], totalPlaytime: 0 }
  }
}

function saveData(data: StoredData): void {
  const p = getStoragePath()
  const dir = path.dirname(p)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(p, JSON.stringify(data, null, 2))
}

// Parse Roblox log lines for activity events
function parseLine(line: string): ActivityEvent | null {
  // Game join: "[FLog::Output] ! Joining game '...' place <placeId>"
  const joinMatch = line.match(/Joining game '([^']+)'.*?place\s+(\d+)/i)
  if (joinMatch) {
    return {
      type: 'join',
      placeName: joinMatch[1],
      placeId: joinMatch[2],
      timestamp: Date.now()
    }
  }

  // Alternative join pattern from newer Roblox versions
  const joinMatch2 = line.match(/GameJoinUtil.*?placeId=(\d+)/i)
  if (joinMatch2) {
    return { type: 'join', placeId: joinMatch2[1], timestamp: Date.now() }
  }

  // Game leave
  if (
    line.includes('Game disconnect') ||
    line.includes('Disconnect finished') ||
    line.includes('RCC: Disconnecting')
  ) {
    return { type: 'leave', timestamp: Date.now() }
  }

  return null
}

function getMostRecentLog(): string | null {
  if (!existsSync(ROBLOX_LOGS_DIR)) return null
  try {
    const files = readdirSync(ROBLOX_LOGS_DIR)
      .filter((f) => f.endsWith('.log'))
      .map((f) => ({
        name: f,
        path: path.join(ROBLOX_LOGS_DIR, f)
      }))
    if (files.length === 0) return null
    // Sort by name desc (Roblox logs are timestamped)
    files.sort((a, b) => b.name.localeCompare(a.name))
    return files[0].path
  } catch {
    return null
  }
}

export const activityTracker = {
  _watcher: null as ReturnType<typeof chokidar.watch> | null,
  _currentSession: null as SessionRecord | null,
  _data: loadData(),

  startWatching(onEvent: (event: ActivityEvent) => void): void {
    if (!existsSync(ROBLOX_LOGS_DIR)) {
      console.log('[ActivityTracker] Roblox logs dir not found — skipping watcher')
      return
    }

    this._watcher = chokidar.watch(ROBLOX_LOGS_DIR, {
      persistent: true,
      ignoreInitial: true,
      usePolling: true,   // polling avoids fsevents native module issues in Electron
      interval: 1500
    })

    let lastSize = 0

    this._watcher.on('change', (filePath) => {
      if (!filePath.endsWith('.log')) return

      // Read only the newest part of the file
      try {
        const content = readFileSync(filePath, 'utf-8')
        const lines = content.split('\n')
        const newLines = lines.slice(lastSize)
        lastSize = lines.length

        for (const line of newLines) {
          const event = parseLine(line)
          if (!event) continue

          if (event.type === 'join') {
            this._currentSession = {
              placeId: event.placeId ?? 'unknown',
              placeName: event.placeName ?? 'Unknown Game',
              startTime: event.timestamp
            }
          } else if (event.type === 'leave' && this._currentSession) {
            const session = this._currentSession
            session.endTime = event.timestamp
            session.duration = session.endTime - session.startTime

            this._data.sessions.unshift(session)
            if (this._data.sessions.length > 200) this._data.sessions.pop()
            this._data.totalPlaytime += session.duration
            saveData(this._data)
            this._currentSession = null
          }

          onEvent(event)
        }
      } catch {
        // File may be locked or being written — ignore
      }
    })

    // Also watch for new log files
    this._watcher.on('add', (filePath) => {
      if (filePath.endsWith('.log')) lastSize = 0
    })
  },

  stopWatching(): void {
    this._watcher?.close()
    this._watcher = null
  },

  getHistory(): SessionRecord[] {
    this._data = loadData()
    return this._data.sessions
  },

  getStats(): {
    totalPlaytime: number
    sessionCount: number
    currentSession: SessionRecord | null
  } {
    this._data = loadData()
    return {
      totalPlaytime: this._data.totalPlaytime,
      sessionCount: this._data.sessions.length,
      currentSession: this._currentSession
    }
  }
}
