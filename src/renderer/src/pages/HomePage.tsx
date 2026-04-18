import React, { useEffect, useState } from 'react'
import {
  Rocket, Download, RefreshCw, Clock, Gamepad2, Wifi, WifiOff, AlertCircle
} from 'lucide-react'
import type { User } from 'firebase/auth'
import { SessionRecord, ActivityEvent } from '../types'

function formatDuration(ms: number): string {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

interface Props { user?: User }

export function HomePage({ user }: Props = {}) {
  const [installed, setInstalled] = useState<boolean | null>(null)
  const [version, setVersion]     = useState<string | null>(null)
  const [launching, setLaunching] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [stats, setStats]         = useState<{
    totalPlaytime: number
    sessionCount: number
    currentSession: SessionRecord | null
  } | null>(null)
  const [history, setHistory] = useState<SessionRecord[]>([])
  const [discordStatus, setDiscordStatus] = useState<{
    connected: boolean; enabled: boolean; currentGame?: string
  } | null>(null)

  useEffect(() => {
    async function load() {
      const [inst, ver, st, hist, ds] = await Promise.all([
        window.api.roblox.isInstalled(),
        window.api.roblox.getVersion(),
        window.api.activity.getStats(),
        window.api.activity.getHistory(),
        window.api.discord.getStatus()
      ])
      setInstalled(inst)
      setVersion(ver)
      setStats(st)
      setHistory(hist.slice(0, 5))
      setDiscordStatus(ds)
    }
    load()

    window.api.activity.onEvent((event: ActivityEvent) => {
      if (event.type === 'join') {
        setStats((prev) => prev ? { ...prev, currentSession: {
          placeId: event.placeId ?? '',
          placeName: event.placeName ?? 'Unknown Game',
          startTime: event.timestamp
        }} : prev)
      } else {
        setStats((prev) => prev ? { ...prev, currentSession: null } : prev)
        // Refresh history
        window.api.activity.getHistory().then((h) => setHistory(h.slice(0, 5)))
        window.api.activity.getStats().then(setStats)
      }
    })
  }, [])

  async function launch() {
    setError(null)
    setLaunching(true)
    const res = await window.api.roblox.launch()
    if (!res.success) setError(res.error ?? 'Failed to launch Roblox.')
    setLaunching(false)
  }

  async function install() {
    const res = await window.api.roblox.install()
    if (!res.success) setError(res.error ?? 'Failed to open download page.')
  }

  return (
    <div className="px-6 pb-6" style={{ paddingTop: 'var(--titlebar-h)' }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Home</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Launch and manage your Roblox experience
        </p>
      </div>

      {/* Status card */}
      <div className="card p-5 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-mac-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #FF3B30 0%, #FF6B35 100%)' }}
            >
              <Gamepad2 size={22} className="text-white" />
            </div>
            <div>
              <div className="font-semibold text-white">Roblox</div>
              <div className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {installed === null
                  ? 'Checking...'
                  : installed
                  ? `Installed${version ? ` · v${version}` : ''}`
                  : 'Not installed'}
              </div>
            </div>
          </div>

          {installed ? (
            <button
              className="btn-primary"
              onClick={launch}
              disabled={launching}
            >
              {launching ? (
                <RefreshCw size={15} className="animate-spin" />
              ) : (
                <Rocket size={15} />
              )}
              {launching ? 'Launching…' : 'Launch Roblox'}
            </button>
          ) : (
            <button className="btn-primary" onClick={install}>
              <Download size={15} />
              Install Roblox
            </button>
          )}
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-sm px-3 py-2 rounded-mac"
            style={{ background: 'rgba(255,59,48,0.15)', color: 'var(--red)' }}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {stats?.currentSession && (
          <div className="mt-3 flex items-center gap-2 text-sm px-3 py-2 rounded-mac"
            style={{ background: 'rgba(52, 199, 89, 0.12)', color: 'var(--green)' }}>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Playing <strong>{stats.currentSession.placeName}</strong>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          {
            label: 'Total Playtime',
            value: stats ? formatDuration(stats.totalPlaytime) : '—',
            icon: Clock,
            color: '#007AFF'
          },
          {
            label: 'Sessions',
            value: stats ? stats.sessionCount.toString() : '—',
            icon: Gamepad2,
            color: '#AF52DE'
          },
          {
            label: 'Discord RPC',
            value: discordStatus?.connected
              ? discordStatus.currentGame ?? 'Connected'
              : discordStatus?.enabled
              ? 'Connecting…'
              : 'Disabled',
            icon: discordStatus?.connected ? Wifi : WifiOff,
            color: discordStatus?.connected ? '#34C759' : '#8E8E93'
          }
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4">
            <div
              className="w-8 h-8 rounded-mac flex items-center justify-center mb-2"
              style={{ background: `${color}22` }}
            >
              <Icon size={16} style={{ color }} />
            </div>
            <div className="text-lg font-semibold text-white truncate">{value}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Recent sessions */}
      {history.length > 0 && (
        <div>
          <div className="section-header px-1">Recent Sessions</div>
          <div className="card overflow-hidden">
            {history.map((s, i) => (
              <div
                key={i}
                className="setting-row"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-mac flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: `hsl(${(parseInt(s.placeId) || i * 60) % 360},60%,45%)` }}
                  >
                    {(s.placeName?.[0] ?? 'R').toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm text-white font-medium">{s.placeName}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {formatDate(s.startTime)}
                    </div>
                  </div>
                </div>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {s.duration ? formatDuration(s.duration) : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
